/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, forwardRef, OnDestroy, Output, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import {
    AssetDto,
    DialogModel,
    ExternalControlComponent,
    ResourceLoaderService,
    Types
} from '@app/shared/internal';

declare var tinymce: any;

export const SQX_RICH_EDITOR_CONTROL_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichEditorComponent), multi: true
};

@Component({
    selector: 'sqx-rich-editor',
    styleUrls: ['./rich-editor.component.scss'],
    templateUrl: './rich-editor.component.html',
    providers: [SQX_RICH_EDITOR_CONTROL_VALUE_ACCESSOR],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RichEditorComponent extends ExternalControlComponent<string> implements AfterViewInit, OnDestroy {
    private tinyEditor: any;
    private tinyInitTimer: any;
    private value: string;
    private isDisabled = false;

    public assetsDialog = new DialogModel();

    @ViewChild('editor')
    public editor: ElementRef;

    @Output()
    public assetPluginClicked = new EventEmitter<any>();

    constructor(changeDetector: ChangeDetectorRef,
        private readonly resourceLoader: ResourceLoaderService
    ) {
        super(changeDetector);
    }

    public ngOnDestroy() {
        clearTimeout(this.tinyInitTimer);

        tinymce.remove(this.editor);
    }

    public ngAfterViewInit() {
        const self = this;

        this.resourceLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.5.4/tinymce.min.js').then(() => {
            tinymce.init(self.getEditorOptions());
        });
    }

    private showSelector = () => {
        this.assetsDialog.show();
    }

    private getEditorOptions() {
        const self = this;

        return {
            convert_fonts_to_spans: true,
            convert_urls: false,
            plugins: 'code image media link lists advlist',
            removed_menuitems: 'newdocument',
            resize: true,
            theme: 'modern',
            toolbar: 'undo redo | styleselect | bold italic | alignleft aligncenter | bullist numlist outdent indent | link image media | assets',
            setup: (editor: any) => {
                self.tinyEditor = editor;
                self.tinyEditor.setMode(this.isDisabled ? 'readonly' : 'design');

                self.tinyEditor.addButton('assets', {
                    onclick: this.showSelector,
                    icon: 'assets',
                    text: '',
                    tooltip: 'Insert Assets'
                });

                self.tinyEditor.on('change', () => {
                    const value = editor.getContent();

                    if (this.value !== value) {
                        this.value = value;

                        self.callChange(value);
                    }
                });

                self.tinyEditor.on('blur', () => {
                    self.callTouched();
                });

                self.tinyInitTimer =
                    setTimeout(() => {
                        self.tinyEditor.setContent(this.value || '');
                    }, 1000);
            },

            target: this.editor.nativeElement
        };
    }

    public writeValue(obj: any) {
        this.value = Types.isString(obj) ? obj : '';

        if (this.tinyEditor) {
            this.tinyEditor.setContent(this.value);
        }
    }

    public setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;

        if (this.tinyEditor) {
            this.tinyEditor.setMode(isDisabled ? 'readonly' : 'design');
        }
    }

    public insertAssets(assets: AssetDto[]) {
        let content = '';

        for (let asset of assets) {
            content += `<img src="${asset.url}" alt="${asset.fileName}" />`;
        }

        if (content.length > 0) {
            this.tinyEditor.execCommand('mceInsertContent', false, content);
        }

        this.assetsDialog.hide();
    }
}