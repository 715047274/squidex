/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import {
    WorkflowDto,
    WorkflowStep,
    WorkflowStepValues,
    WorkflowTransition,
    WorkflowTransitionView
} from '@app/shared';

@Component({
    selector: 'sqx-workflow-step',
    styleUrls: ['./workflow-step.component.scss'],
    templateUrl: './workflow-step.component.html'
})
export class WorkflowStepComponent implements OnChanges {
    @Input()
    public workflow: WorkflowDto;

    @Input()
    public step: WorkflowStep;

    @Output()
    public transitionRemove = new EventEmitter<WorkflowTransition>();

    @Output()
    public update = new EventEmitter<WorkflowStepValues>();

    @Output()
    public rename = new EventEmitter<string>();

    @Output()
    public remove = new EventEmitter();

    public openSteps: WorkflowStep[];

    public transitions: WorkflowTransitionView[];

    public ngOnChanges(changes: SimpleChanges) {
        if (changes['workflow'] || changes['step']) {
            this.openSteps = this.workflow.getOpenSteps(this.step);

            this.transitions = this.workflow.getTransitions(this.step);
        }
    }

    public changeName(name: string) {
        this.rename.emit(name);
    }

    public changeColor(color: string) {
        this.update.emit({ color });
    }
}

