/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import {
    EditPatternForm,
    hasAnyLink,
    PatternDto,
    PatternsState
} from '@app/shared';

@Component({
    selector: 'sqx-pattern',
    styleUrls: ['./pattern.component.scss'],
    templateUrl: './pattern.component.html'
})
export class PatternComponent implements OnInit {
    @Input()
    public pattern: PatternDto;

    public editForm = new EditPatternForm(this.formBuilder);

    public isEditable = false;
    public isDeletable = false;

    constructor(
        private readonly patternsState: PatternsState,
        private readonly formBuilder: FormBuilder
    ) {
    }

    public ngOnInit() {
        this.isEditable = !this.pattern || hasAnyLink(this.pattern, 'update');
        this.isDeletable = !this.pattern && hasAnyLink(this.pattern, 'delete');

        this.editForm.load(this.pattern);

        if (!this.isEditable) {
            this.editForm.form.disable();
        }
    }

    public cancel() {
        this.editForm.submitCompleted({ newValue: this.pattern });
    }

    public delete() {
        this.patternsState.delete(this.pattern);
    }

    public save() {
        if (!this.isEditable) {
            return;
        }

        const value = this.editForm.submit();

        if (value) {
            if (this.pattern) {
                this.patternsState.update(this.pattern, value)
                    .subscribe(newPattern => {
                        this.editForm.submitCompleted({ newValue: newPattern });
                    }, error => {
                        this.editForm.submitFailed(error);
                    });
            } else {
                this.patternsState.create(value)
                    .subscribe(() => {
                        this.editForm.submitCompleted();
                    }, error => {
                        this.editForm.submitFailed(error);
                    });
            }
        }
    }
}

