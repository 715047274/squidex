/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';

import {
    DialogService,
    ImmutableArray,
    shareSubscribed,
    State,
    Version
} from '@app/framework';

import { AuthService } from './../services/auth.service';
import { PlanDto, PlansService } from './../services/plans.service';
import { AppsState } from './apps.state';

interface PlanInfo {
    // The plan.
    plan: PlanDto;

    // Indicates if the yearly subscription is selected.
    isYearlySelected?: boolean;

    // Indicates if the monthly subscription is selected.
    isSelected?: boolean;
}

interface Snapshot {
    // The current plans.
    plans: ImmutableArray<PlanInfo>;

    // Indicates if the user is the plan owner.
    isOwner?: boolean;

    // Indicates if the plans are loaded.
    isLoaded?: boolean;

    // Indicates if there is a billing portal for the current Squidex instance.
    hasPortal?: boolean;

    // The app version.
    version: Version;
}

@Injectable()
export class PlansState extends State<Snapshot> {
    public plans =
        this.changes.pipe(map(x => x.plans),
            distinctUntilChanged());

    public isOwner =
        this.changes.pipe(map(x => !!x.isOwner),
            distinctUntilChanged());

    public isLoaded =
        this.changes.pipe(map(x => !!x.isLoaded),
            distinctUntilChanged());

    public isDisabled =
        this.changes.pipe(map(x => !x.isOwner),
            distinctUntilChanged());

    public hasPortal =
        this.changes.pipe(map(x => x.hasPortal),
            distinctUntilChanged());

    public window = window;

    constructor(
        private readonly appsState: AppsState,
        private readonly authState: AuthService,
        private readonly dialogs: DialogService,
        private readonly plansService: PlansService
    ) {
        super({ plans: ImmutableArray.empty(), version: new Version('') });
    }

    public load(isReload = false, overridePlanId?: string): Observable<any> {
        if (!isReload) {
            this.resetState();
        }

        return this.plansService.getPlans(this.appName).pipe(
            tap(({ version, payload }) => {
                if (isReload) {
                    this.dialogs.notifyInfo('Plans reloaded.');
                }

                this.next(s => {
                    const planId = overridePlanId || payload.currentPlanId;
                    const plans = ImmutableArray.of(payload.plans.map(x => this.createPlan(x, planId)));

                    return {
                        ...s,
                        plans: plans,
                        isOwner: !payload.planOwner || payload.planOwner === this.userId,
                        isLoaded: true,
                        version,
                        hasPortal: payload.hasPortal
                    };
                });
            }),
            shareSubscribed(this.dialogs));
    }

    public change(planId: string): Observable<any> {
        return this.plansService.putPlan(this.appName, { planId }, this.version).pipe(
            tap(dto => {
                if (dto.payload.redirectUri && dto.payload.redirectUri.length > 0) {
                    this.window.location.href = dto.payload.redirectUri;
                } else {
                    this.next(s => {
                        const plans = s.plans.map(x => this.createPlan(x.plan, planId));

                        return { ...s, plans, isOwner: true, version: dto.version };
                    });
                }
            }),
            shareSubscribed(this.dialogs));
    }

    private createPlan(plan: PlanDto, id: string) {
        return { plan, isYearlySelected: plan.yearlyId === id, isSelected: plan.id === id };
    }

    private get appName() {
        return this.appsState.appName;
    }

    private get userId() {
        return this.authState.user!.id;
    }

    private get version() {
        return this.snapshot.version;
    }
}

