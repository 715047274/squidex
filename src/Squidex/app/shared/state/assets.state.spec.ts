/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { of } from 'rxjs';
import { IMock, It, Mock, Times } from 'typemoq';

import {
    AssetDto,
    AssetsDto,
    AssetsService,
    AssetsState,
    DialogService,
    versioned
} from '@app/shared/internal';

import { TestValues } from './_test-helpers';

describe('AssetsState', () => {
    const {
        app,
        appsState,
        creation,
        creator,
        modified,
        modifier,
        newVersion,
        version
    } = TestValues;

    const oldAssets = [
        new AssetDto('id1', creator, creator, creation, creation, 'name1', 'hash1', 'type1', 1, 1, 'mime1', false, false, null, null, 'slug1', ['tag1', 'shared'], 'url1', version),
        new AssetDto('id2', creator, creator, creation, creation, 'name2', 'hash2', 'type2', 2, 2, 'mime2', false, false, null, null, 'slug2', ['tag2', 'shared'], 'url2', version)
    ];

    const newAsset = new AssetDto('id1', modifier, modifier, modified, modified, 'name3', 'hash3', 'type3', 3, 3, 'mime3', false, true, 0, 0, 'slug3', ['new'], 'url3', version);

    let dialogs: IMock<DialogService>;
    let assetsService: IMock<AssetsService>;
    let assetsState: AssetsState;

    beforeEach(() => {
        dialogs = Mock.ofType<DialogService>();

        assetsService = Mock.ofType<AssetsService>();
        assetsState = new AssetsState(appsState.object, assetsService.object, dialogs.object);
    });

    afterEach(() => {
        assetsService.verifyAll();
    });

    describe('Loading', () => {
        beforeEach(() => {
            assetsService.setup(x => x.getTags(app))
                .returns(() => of({ tag1: 1, shared: 2, tag2: 1 })).verifiable(Times.atLeastOnce());
        });

        it('should load assets', () => {
            assetsService.setup(x => x.getAssets(app, 30, 0, undefined, []))
                .returns(() => of(new AssetsDto(200, oldAssets))).verifiable();

            assetsState.load().subscribe();

            expect(assetsState.snapshot.assets.values).toEqual(oldAssets);
            expect(assetsState.snapshot.assetsPager.numberOfItems).toEqual(200);
            expect(assetsState.snapshot.isLoaded).toBeTruthy();

            dialogs.verify(x => x.notifyInfo(It.isAnyString()), Times.never());
        });

        it('should show notification on load when reload is true', () => {
            assetsService.setup(x => x.getAssets(app, 30, 0, undefined, []))
                .returns(() => of(new AssetsDto(200, oldAssets))).verifiable();

            assetsState.load(true).subscribe();

            expect().nothing();

            dialogs.verify(x => x.notifyInfo(It.isAnyString()), Times.once());
        });

        it('should load with tags when tag toggled', () => {
            assetsService.setup(x => x.getAssets(app, 30, 0, undefined, ['tag1']))
                .returns(() => of(new AssetsDto(0, []))).verifiable();

            assetsState.toggleTag('tag1').subscribe();

            expect(assetsState.isTagSelected('tag1')).toBeTruthy();
        });

        it('should load without tags when tag toggled', () => {
            assetsService.setup(x => x.getAssets(app, 30, 0, undefined, ['tag1']))
                .returns(() => of(new AssetsDto(0, []))).verifiable();

            assetsService.setup(x => x.getAssets(app, 30, 0, undefined, []))
                .returns(() => of(new AssetsDto(0, []))).verifiable();

            assetsState.toggleTag('tag1').subscribe();
            assetsState.toggleTag('tag1').subscribe();

            expect(assetsState.isTagSelected('tag1')).toBeFalsy();
        });

        it('should load with tags when tags selected', () => {
            assetsService.setup(x => x.getAssets(app, 30, 0, undefined, ['tag1', 'tag2']))
                .returns(() => of(new AssetsDto(0, []))).verifiable();

            assetsState.selectTags(['tag1', 'tag2']).subscribe();

            expect(assetsState.isTagSelected('tag1')).toBeTruthy();
        });

        it('should load without tags when tags reset', () => {
            assetsService.setup(x => x.getAssets(app, 30, 0, undefined, []))
                .returns(() => of(new AssetsDto(0, []))).verifiable();

            assetsState.resetTags().subscribe();

            expect(assetsState.isTagSelectionEmpty()).toBeTruthy();
        });

        it('should load next page and prev page when paging', () => {
            assetsService.setup(x => x.getAssets(app, 30, 0, undefined, []))
                .returns(() => of(new AssetsDto(200, []))).verifiable(Times.exactly(2));

            assetsService.setup(x => x.getAssets(app, 30, 30, undefined, []))
                .returns(() => of(new AssetsDto(200, []))).verifiable();

            assetsState.load().subscribe();
            assetsState.goNext().subscribe();
            assetsState.goPrev().subscribe();

            expect().nothing();
        });

        it('should load with query when searching', () => {
            assetsService.setup(x => x.getAssets(app, 30, 0, 'my-query', []))
                .returns(() => of(new AssetsDto(0, []))).verifiable();

            assetsState.search('my-query').subscribe();

            expect(assetsState.snapshot.assetsQuery).toEqual('my-query');
        });
    });

    describe('Updates', () => {
        beforeEach(() => {
            assetsService.setup(x => x.getAssets(app, 30, 0, undefined, []))
                .returns(() => of(new AssetsDto(200, oldAssets))).verifiable();

            assetsService.setup(x => x.getTags(app))
                .returns(() => of({ tag1: 1, shared: 2, tag2: 1 })).verifiable();

            assetsState.load(true).subscribe();
        });

        it('should add asset to snapshot when created', () => {
            assetsState.add(newAsset);

            expect(assetsState.snapshot.assets.values).toEqual([newAsset, ...oldAssets]);
            expect(assetsState.snapshot.assetsPager.numberOfItems).toBe(201);
        });

        it('should increment tags when asset added', () => {
            assetsState.add(newAsset);
            assetsState.add(newAsset);

            expect(assetsState.snapshot.tags).toEqual({ tag1: 1, tag2: 1, shared: 2, new: 2 });
        });

        it('should update properties when updated', () => {
            assetsState.update(newAsset);

            const asset_1 = assetsState.snapshot.assets.at(0);

            expect(asset_1).toBe(newAsset);
            expect(assetsState.snapshot.tags).toEqual({ tag2: 1, shared: 1, new: 1 });
        });

        it('should remove asset from snapshot when deleted', () => {
            assetsService.setup(x => x.deleteAsset(app, oldAssets[0].id, version))
                .returns(() => of(versioned(newVersion)));

            assetsState.delete(oldAssets[0]).subscribe();

            expect(assetsState.snapshot.assets.values.length).toBe(1);
            expect(assetsState.snapshot.assetsPager.numberOfItems).toBe(199);
            expect(assetsState.snapshot.tags).toEqual({ shared: 1, tag2: 1 });
        });
    });
});