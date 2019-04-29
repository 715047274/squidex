/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

// tslint:disable: only-arrow-functions

import { Observable } from 'rxjs';
import { map, onErrorResumeNext, shareReplay, switchMap } from 'rxjs/operators';

import { DialogService } from './../services/dialog.service';

import {
    Version,
    versioned,
    Versioned
} from './version';

export function mapVersioned<T = any, R = any>(project: (value: T, version: Version) => R) {
    return function mapOperation(source: Observable<Versioned<T>>) {
        return source.pipe(map<Versioned<T>, Versioned<R>>(({ version, payload }) => {
            return versioned(version, project(payload, version));
        }));
    };
}

type Options<T, R = T> = { silent?: boolean, project?: ((value: T) => R) };

export function shareSubscribed<T, R = T>(dialogs: DialogService, options?: Options<T, R>) {
    return function mapOperation(source: Observable<T>) {
        const shared = source.pipe(shareReplay());

        shared.subscribe(undefined, error => {
            if (dialogs && (!options || !options.silent)) {
                dialogs.notifyError(error);
            }
        });

        if (options && !!options.project) {
            const project = options.project;

            return shared.pipe(map(x => project(x)));
        } else {
            return <any>shared;
        }
    };
}

export function switchSafe<T, R>(project: (source: T) => Observable<R>) {
    return function mapOperation(source: Observable<T>) {
        return source.pipe(switchMap(project), onErrorResumeNext<R, R>());
    };
}

export function ofForever<T>(...values: T[]) {
    return new Observable<T>(s => {
        for (let value of values) {
            s.next(value);
        }
    });
}