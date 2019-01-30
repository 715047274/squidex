/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

// tslint:disable:prefer-for-of

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import {
    AppsState,
    AssetDto,
    AssetsService,
    DialogModel,
    ImmutableArray,
    LocalStoreService,
    MessageBus,
    StatefulControlComponent,
    Types
} from '@app/shared';

export const SQX_ASSETS_EDITOR_CONTROL_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AssetsEditorComponent), multi: true
};

class AssetUpdated {
    constructor(
        public readonly asset: AssetDto,
        public readonly source: any
    ) {
    }
}

interface State {
    newAssets: ImmutableArray<File>;

    oldAssets: ImmutableArray<AssetDto>;

    isListView: boolean;
}

@Component({
    selector: 'sqx-assets-editor',
    styleUrls: ['./assets-editor.component.scss'],
    templateUrl: './assets-editor.component.html',
    providers: [SQX_ASSETS_EDITOR_CONTROL_VALUE_ACCESSOR],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetsEditorComponent extends StatefulControlComponent<State, string[]> implements OnInit {
    public assetsDialog = new DialogModel();

    constructor(changeDetector: ChangeDetectorRef,
        private readonly appsState: AppsState,
        private readonly assetsService: AssetsService,
        private readonly localStore: LocalStoreService,
        private readonly messageBus: MessageBus
    ) {
        super(changeDetector, {
            oldAssets: ImmutableArray.empty(),
            newAssets: ImmutableArray.empty(),
            isListView: localStore.getBoolean('squidex.assets.list-view')
        });
    }

    public writeValue(obj: any) {
        if (Types.isArrayOfString(obj)) {
            if (!Types.isEquals(obj, this.snapshot.oldAssets.map(x => x.id).values)) {
                const assetIds: string[] = obj;

                this.assetsService.getAssets(this.appsState.appName, 0, 0, undefined, undefined, obj)
                    .subscribe(dtos => {
                        this.setAssets(ImmutableArray.of(assetIds.map(id => dtos.items.find(x => x.id === id)!).filter(a => !!a)));

                        if (this.snapshot.oldAssets.length !== assetIds.length) {
                            this.updateValue();
                        }
                    }, () => {
                        this.setAssets(ImmutableArray.empty());
                    });
            }
        } else {
            this.setAssets(ImmutableArray.empty());
        }
    }

    public notifyOthers(asset: AssetDto) {
        this.messageBus.emit(new AssetUpdated(asset, this));
    }

    public ngOnInit() {
        this.observe(
            this.messageBus.of(AssetUpdated)
                .subscribe(event => {
                    if (event.source !== this) {
                        this.setAssets(this.snapshot.oldAssets.replaceBy('id', event.asset));
                    }
                }));
    }

    public setAssets(oldAssets: ImmutableArray<AssetDto>) {
        this.next(s => ({ ...s, oldAssets }));
    }

    public pasteFiles(event: ClipboardEvent) {
        for (let i = 0; i < event.clipboardData.items.length; i++) {
            const file = event.clipboardData.items[i].getAsFile();

            if (file) {
                this.next(s => ({ ...s, newAssets: s.newAssets.pushFront(file) }));
            }
        }
    }

    public addFiles(files: FileList) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (file) {
                this.next(s => ({ ...s, newAssets: s.newAssets.pushFront(file) }));
            }
        }
    }

    public selectAssets(assets: AssetDto[]) {
        this.setAssets(this.snapshot.oldAssets.push(...assets));

        if (assets.length > 0) {
            this.updateValue();
        }

        this.assetsDialog.hide();
    }

    public addAsset(file: File, asset: AssetDto) {
        if (asset && file) {
            this.next(s => ({
                ...s,
                newAssets: s.newAssets.remove(file),
                oldAssets: s.oldAssets.pushFront(asset)
            }));

            this.updateValue();
        }
    }

    public sortAssets(assets: AssetDto[]) {
        if (assets) {
            this.setAssets(ImmutableArray.of(assets));

            this.updateValue();
        }
    }

    public removeLoadedAsset(asset: AssetDto) {
        if (asset) {
            this.setAssets(this.snapshot.oldAssets.remove(asset));

            this.updateValue();
        }
    }

    public removeLoadingAsset(file: File) {
        this.next(s => ({ ...s, newAssets: s.newAssets.remove(file) }));
    }

    public changeView(isListView: boolean) {
        this.next(s => ({ ...s, isListView }));

        this.localStore.setBoolean('squidex.assets.list-view', isListView);
    }

    private updateValue() {
        let ids: string[] | null = this.snapshot.oldAssets.values.map(x => x.id);

        if (ids.length === 0) {
            ids = null;
        }

        this.callTouched();
        this.callChange(ids);
    }

    public trackByAsset(asset: AssetDto) {
        return asset.id;
    }
}