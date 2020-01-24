﻿// ==========================================================================
//  Squidex Headless CMS
// ==========================================================================
//  Copyright (c) Squidex UG (haftungsbeschraenkt)
//  All rights reserved. Licensed under the MIT license.
// ==========================================================================

using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Squidex.ClientLibrary;
using Squidex.ClientLibrary.Management;
using TestSuite.Fixtures;
using Xunit;

#pragma warning disable SA1300 // Element should begin with upper-case letter
#pragma warning disable SA1507 // Code should not contain multiple blank lines in a row

namespace TestSuite.ApiTests
{
    public class AssetTests : IClassFixture<AssetFixture>
    {
        public AssetFixture _ { get; }

        public AssetTests(AssetFixture fixture)
        {
            _ = fixture;
        }

        [Fact]
        public async Task Should_upload_image()
        {
            var fileName = $"{Guid.NewGuid()}.png";

            using (var stream = new FileStream("Assets/logo-squared.png", FileMode.Open))
            {
                var file = new FileParameter(stream, fileName, "image/png");

                var asset = await _.Assets.PostAssetAsync(_.AppName, file);

                // Should create metadata.
                Assert.True(asset.IsImage);
                Assert.Equal(600, asset.PixelHeight);
                Assert.Equal(600, asset.PixelWidth);
                Assert.Equal(600L, asset.Metadata["pixelHeight"]);
                Assert.Equal(600L, asset.Metadata["pixelWidth"]);
            }
        }

        [Fact]
        public async Task Should_upload_image_without_extension()
        {
            var fileName = $"{Guid.NewGuid()}.png";

            using (var stream = new FileStream("Assets/logo-squared.png", FileMode.Open))
            {
                var file = new FileParameter(stream, fileName, "image/png");

                var asset = await _.Assets.PostAssetAsync(_.AppName, file);

                // Should create metadata.
                Assert.True(asset.IsImage);
                Assert.Equal(600, asset.PixelHeight);
                Assert.Equal(600, asset.PixelWidth);
                Assert.Equal(600L, asset.Metadata["pixelHeight"]);
                Assert.Equal(600L, asset.Metadata["pixelWidth"]);
            }
        }

        [Fact]
        public async Task Should_replace_asset()
        {
            var fileName = $"{Guid.NewGuid()}.png";

            AssetDto asset;

            // STEP 1: Create asset
            using (var stream = new FileStream("Assets/logo-squared.png", FileMode.Open))
            {
                var file = new FileParameter(stream, fileName, "image/png");

                asset = await _.Assets.PostAssetAsync(_.AppName, file);

                Assert.True(asset.IsImage);
                Assert.Equal(600, asset.PixelHeight);
                Assert.Equal(600, asset.PixelWidth);
            }


            // STEP 2: Reupload asset
            using (var stream = new FileStream("Assets/logo-wide.png", FileMode.Open))
            {
                var file = new FileParameter(stream, fileName, "image/png");

                asset = await _.Assets.PutAssetContentAsync(_.AppName, asset.Id.ToString(), file);

                // Should update metadata.
                Assert.True(asset.IsImage);
                Assert.Equal(135, asset.PixelHeight);
                Assert.Equal(600, asset.PixelWidth);
            }

            using (var stream = new FileStream("Assets/logo-wide.png", FileMode.Open))
            {
                var downloaded = await DownloadAsync(asset);

                // Should dowload with correct size.
                Assert.Equal(stream.Length, downloaded.Length);
            }
        }

        [Fact]
        public async Task Should_annote_asset()
        {
            var fileName = $"{Guid.NewGuid()}.png";

            AssetDto asset;

            // STEP 1: Create asset
            using (var stream = new FileStream("Assets/logo-squared.png", FileMode.Open))
            {
                var file = new FileParameter(stream, fileName, "image/png");

                asset = await _.Assets.PostAssetAsync(_.AppName, file);
            }


            // STEP 2: Annotate metadata.
            var metadataRequest = new AnnotateAssetDto
            {
                Metadata = new Dictionary<string, object>
                {
                    ["pw"] = 100L,
                    ["ph"] = 20L
                }
            };

            asset = await _.Assets.PutAssetAsync(_.AppName, asset.Id.ToString(), metadataRequest);

            // Should provide metadata.
            Assert.Equal(metadataRequest.Metadata, asset.Metadata);


            // STEP 3: Annotate slug.
            var slugRequest = new AnnotateAssetDto { Slug = "my-image" };

            asset = await _.Assets.PutAssetAsync(_.AppName, asset.Id.ToString(), slugRequest);

            // Should provide updated slug.
            Assert.Equal(slugRequest.Slug, asset.Slug);


            // STEP 3: Annotate file name.
            var fileNameRequest = new AnnotateAssetDto { FileName = "My Image" };

            asset = await _.Assets.PutAssetAsync(_.AppName, asset.Id.ToString(), fileNameRequest);

            // Should provide updated file name.
            Assert.Equal(fileNameRequest.FileName, asset.FileName);
        }

        [Fact]
        public async Task Should_protect_asset()
        {
            var fileName = $"{Guid.NewGuid()}.png";

            AssetDto asset;

            // STEP 1: Create asset
            using (var stream = new FileStream("Assets/logo-squared.png", FileMode.Open))
            {
                var file = new FileParameter(stream, fileName, "image/png");

                asset = await _.Assets.PostAssetAsync(_.AppName, file);
            }


            // STEP 2: Download asset
            using (var stream = new FileStream("Assets/logo-squared.png", FileMode.Open))
            {
                var downloaded = await DownloadAsync(asset);

                // Should dowload with correct size.
                Assert.Equal(stream.Length, downloaded.Length);
            }


            // STEP 4: Protect asset
            var protectRequest = new AnnotateAssetDto { IsProtected = true };

            asset = await _.Assets.PutAssetAsync(_.AppName, asset.Id.ToString(), protectRequest);


            // STEP 5: Download asset with authentication.
            using (var stream = new FileStream("Assets/logo-squared.png", FileMode.Open))
            {
                var downloaded = new MemoryStream();

                using (var assetStream = await _.Assets.GetAssetContentAsync(asset.Id.ToString()))
                {
                    await assetStream.Stream.CopyToAsync(downloaded);
                }

                // Should dowload with correct size.
                Assert.Equal(stream.Length, downloaded.Length);
            }


            // STEP 5: Download asset without key.
            using (var stream = new FileStream("Assets/logo-squared.png", FileMode.Open))
            {
                var ex = await Assert.ThrowsAsync<HttpRequestException>(() => DownloadAsync(asset));

                // Should return 403 when not authenticated.
                Assert.Contains("403", ex.Message);
            }
        }

        [Fact]
        public async Task Should_delete_asset()
        {
            var fileName = $"{Guid.NewGuid()}.png";

            AssetDto asset;

            // STEP 1: Create asset
            using (var stream = new FileStream("Assets/logo-squared.png", FileMode.Open))
            {
                var file = new FileParameter(stream, fileName, "image/png");

                asset = await _.Assets.PostAssetAsync(_.AppName, file);
            }


            // STEP 2: Delete asset
            await _.Assets.DeleteAssetAsync(_.AppName, asset.Id.ToString());

            // Should return 404 when asset deleted.
            var ex = await Assert.ThrowsAsync<SquidexManagementException>(() => _.Assets.GetAssetAsync(_.AppName, asset.Id.ToString()));

            Assert.Equal(404, ex.StatusCode);
        }

        private async Task<MemoryStream> DownloadAsync(AssetDto asset)
        {
            var temp = new MemoryStream();

            using (var client = new HttpClient())
            {
                var url = $"{_.ServerUrl}{asset._links["content"].Href}";

                var response = await client.GetAsync(url);

                response.EnsureSuccessStatusCode();

                using (var stream = await response.Content.ReadAsStreamAsync())
                {
                    await stream.CopyToAsync(temp);
                }
            }

            return temp;
        }
    }
}
