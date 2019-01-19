/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { onErrorResumeNext } from 'rxjs/operators';

import {
    ContentsState,
    Queries,
    SchemasState,
    UIState
} from '@app/shared';

@Component({
    selector: 'sqx-contents-filters-page',
    styleUrls: ['./contents-filters-page.component.scss'],
    templateUrl: './contents-filters-page.component.html'
})
export class ContentsFiltersPageComponent implements OnDestroy, OnInit {
    private selectedSchemaSubscription: Subscription;

    public schemaQueries: Queries;

    constructor(
        private readonly contentsState: ContentsState,
        private readonly schemasState: SchemasState,
        private readonly uiState: UIState
    ) {
    }

    public ngOnDestroy() {
        this.selectedSchemaSubscription.unsubscribe();
    }

    public ngOnInit() {
        this.selectedSchemaSubscription =
            this.schemasState.selectedSchema
                .subscribe(schema => {
                    if (schema) {
                        this.schemaQueries = new Queries(this.uiState, `schemas.${schema.name}`);
                    }
                });
    }

    public search(query: string) {
        this.contentsState.search(query).pipe(onErrorResumeNext()).subscribe();
    }

    public isSelectedQuery(query: string) {
        return query === this.contentsState.snapshot.contentsQuery || (!query && !this.contentsState.snapshot.contentsQuery);
    }
}