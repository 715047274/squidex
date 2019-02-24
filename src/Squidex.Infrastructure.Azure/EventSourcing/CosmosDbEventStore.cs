﻿// ==========================================================================
//  Squidex Headless CMS
// ==========================================================================
//  Copyright (c) Squidex UG (haftungsbeschraenkt)
//  All rights reserved. Licensed under the MIT license.
// ==========================================================================

using System;
using System.Collections.ObjectModel;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;
using Newtonsoft.Json;

namespace Squidex.Infrastructure.EventSourcing
{
    public sealed partial class CosmosDbEventStore : IEventStore, IInitializable
    {
        private readonly DocumentClient documentClient;
        private readonly Uri databaseUri;
        private readonly Uri collectionUri;
        private readonly string database;

        public CosmosDbEventStore(DocumentClient documentClient, string database)
        {
            Guard.NotNull(documentClient, nameof(documentClient));
            Guard.NotNullOrEmpty(database, nameof(database));

            this.documentClient = documentClient;

            this.databaseUri = UriFactory.CreateDatabaseUri(database);
            this.database = database;

            collectionUri = UriFactory.CreateDocumentCollectionUri(database, FilterBuilder.Collection);
        }

        public async Task InitializeAsync(CancellationToken ct = default)
        {
            await documentClient.CreateDatabaseIfNotExistsAsync(new Database { Id = database });

            await documentClient.CreateDocumentCollectionIfNotExistsAsync(databaseUri,
                new DocumentCollection
                {
                    UniqueKeyPolicy = new UniqueKeyPolicy
                    {
                        UniqueKeys = new Collection<UniqueKey>
                        {
                            new UniqueKey
                            {
                                Paths = new Collection<string>
                                {
                                    $"/{FilterBuilder.EventStreamField}",
                                    $"/{FilterBuilder.EventStreamOffsetField}"
                                }
                            }
                        }
                    },
                    Id = FilterBuilder.Collection,
                },
                new RequestOptions
                {
                    PartitionKey = new PartitionKey($"/{FilterBuilder.EventStreamField}")
                });
        }
    }
}
