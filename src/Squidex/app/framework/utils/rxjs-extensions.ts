/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DialogService } from './../services/dialog.service';

/* tslint:disable:no-shadowed-variable */

export const notify = (dialogs: DialogService) => <T>(source: Observable<T>) =>
    source.pipe(catchError(error => {
        dialogs.notifyError(error);

        return throwError(error);
    }));