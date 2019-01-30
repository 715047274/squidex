/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Sebastian Stehle. All rights r vbeserved
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { timer } from 'rxjs';

import {
    DialogModel,
    DialogRequest,
    DialogService,
    fadeAnimation,
    Notification
} from '@app/framework/internal';

import { StatefulComponent } from '../stateful.component';

interface State {
    dialogRequest?: DialogRequest | null;

    notifications: Notification[];
}

@Component({
    selector: 'sqx-dialog-renderer',
    styleUrls: ['./dialog-renderer.component.scss'],
    templateUrl: './dialog-renderer.component.html',
    animations: [
        fadeAnimation
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogRendererComponent extends StatefulComponent<State> implements OnInit {
    @Input()
    public position = 'bottomright';

    public dialogView = new DialogModel();

    constructor(changeDetector: ChangeDetectorRef,
        private readonly dialogs: DialogService
    ) {
        super(changeDetector, { notifications: [] });
    }

    public ngOnInit() {
        this.observe(
            this.dialogView.isOpen.subscribe(isOpen => {
                if (!isOpen) {
                    this.finishRequest(false);
                }
            }));

        this.observe(
            this.dialogs.notifications.subscribe(notification => {
                this.next(s => ({
                    ...s,
                    notifications: [...s.notifications, notification]
                }));

                if (notification.displayTime > 0) {
                    this.observe(timer(notification.displayTime).subscribe(() => {
                        this.close(notification);
                    }));
                }
            }));

        this.observe(
            this.dialogs.dialogs
                .subscribe(dialogRequest => {
                    this.cancel();

                    this.next(s => ({ ...s, dialogRequest }));
                }));
    }

    public cancel() {
        this.finishRequest(false);

        this.dialogView.hide();
    }

    public confirm() {
        this.finishRequest(true);

        this.dialogView.hide();
    }

    private finishRequest(value: boolean) {
        this.next(s => {
            if (s.dialogRequest) {
                s.dialogRequest.complete(value);
            }

            return { ...s, dialogRequest: null };
        });
    }

    public close(notification: Notification) {
        this.next(s => ({ ...s, notifications: s.notifications.filter(n => notification !== n) }));
    }
}