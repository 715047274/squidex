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
    DateTime,
    DialogService,
    ImmutableArray,
    shareSubscribed,
    State,
    Version,
    Versioned
} from '@app/framework';

import { AuthService} from './../services/auth.service';
import { AppsState } from './apps.state';

import {
    RuleCreatedDto,
    RuleDto,
    RulesService,
    UpsertRuleDto
} from './../services/rules.service';

interface Snapshot {
    // The current rules.
    rules: RulesList;

    // Indicates if the rules are loaded.
    isLoaded?: boolean;
}

type RulesList = ImmutableArray<RuleDto>;

@Injectable()
export class RulesState extends State<Snapshot> {
    public rules =
        this.changes.pipe(map(x => x.rules),
            distinctUntilChanged());

    public isLoaded =
        this.changes.pipe(map(x => !!x.isLoaded),
            distinctUntilChanged());

    constructor(
        private readonly appsState: AppsState,
        private readonly authState: AuthService,
        private readonly dialogs: DialogService,
        private readonly rulesService: RulesService
    ) {
        super({ rules: ImmutableArray.empty() });
    }

    public load(isReload = false): Observable<any> {
        if (!isReload) {
            this.resetState();
        }

        return this.rulesService.getRules(this.appName).pipe(
            tap(payload => {
                if (isReload) {
                    this.dialogs.notifyInfo('Rules reloaded.');
                }

                this.next(s => {
                    const rules = ImmutableArray.of(payload);

                    return { ...s, rules, isLoaded: true };
                });
            }),
            shareSubscribed(this.dialogs));
    }

    public create(request: UpsertRuleDto, now?: DateTime): Observable<RuleDto> {
        return this.rulesService.postRule(this.appName, request).pipe(
            tap(response => {
                this.next(s => {
                    const rules = s.rules.push(createRule(request, response, this.user, now));

                    return { ...s, rules };
                });
            }),
            shareSubscribed(this.dialogs));
    }

    public delete(rule: RuleDto): Observable<any> {
        return this.rulesService.deleteRule(this.appName, rule.id, rule.version).pipe(
            tap(() => {
                this.next(s => {
                    const rules = s.rules.removeAll(x => x.id === rule.id);

                    return { ...s, rules };
                });
            }),
            shareSubscribed(this.dialogs));
    }

    public updateAction(rule: RuleDto, action: any, now?: DateTime): Observable<any> {
        return this.rulesService.putRule(this.appName, rule.id, { action }, rule.version).pipe(
            map(({ version }) => updateAction(rule, action, this.user, version, now)),
            tap(updated => {
                this.replaceRule(updated);
            }),
            shareSubscribed(this.dialogs));
    }

    public updateTrigger(rule: RuleDto, trigger: any, now?: DateTime): Observable<any> {
        return this.rulesService.putRule(this.appName, rule.id, { trigger }, rule.version).pipe(
            map(({ version }) => updateTrigger(rule, trigger, this.user, version, now)),
            tap(updated => {
                this.replaceRule(updated);
            }),
            shareSubscribed(this.dialogs));
    }

    public enable(rule: RuleDto, now?: DateTime): Observable<any> {
        return this.rulesService.enableRule(this.appName, rule.id, rule.version).pipe(
            map(({ version }) => setEnabled(rule, true, this.user, version, now)),
            tap(updated => {
                this.replaceRule(updated);
            }),
            shareSubscribed(this.dialogs));
    }

    public disable(rule: RuleDto, now?: DateTime): Observable<any> {
        return this.rulesService.disableRule(this.appName, rule.id, rule.version).pipe(
            map(({ version }) => setEnabled(rule, false, this.user, version, now)),
            tap(updated => {
                this.replaceRule(updated);
            }),
            shareSubscribed(this.dialogs));
    }

    private replaceRule(rule: RuleDto) {
        this.next(s => {
            const rules = s.rules.replaceBy('id', rule);

            return { ...s, rules };
        });
    }

    private get appName() {
        return this.appsState.appName;
    }

    private get user() {
        return this.authState.user!.token;
    }
}

const updateTrigger = (rule: RuleDto, trigger: any, user: string, version: Version, now?: DateTime) =>
    rule.with({
        trigger,
        triggerType: trigger.triggerType,
        lastModified: now || DateTime.now(),
        lastModifiedBy: user,
        version
    });

const updateAction = (rule: RuleDto, action: any, user: string, version: Version, now?: DateTime) =>
    rule.with({
        action,
        actionType: action.actionType,
        lastModified: now || DateTime.now(),
        lastModifiedBy: user,
        version
    });

const setEnabled = (rule: RuleDto, isEnabled: boolean, user: string, version: Version, now?: DateTime) =>
    rule.with({
        isEnabled,
        lastModified: now || DateTime.now(),
        lastModifiedBy: user,
        version
    });

function createRule(request: UpsertRuleDto, { payload, version }: Versioned<RuleCreatedDto>, user: string, now?: DateTime) {
    now = now || DateTime.now();

    const { triggerType, ...trigger } = request.trigger;

    const { actionType, ...action } = request.action;

    const rule = new RuleDto(
        payload.id,
        user,
        user,
        now,
        now,
        version,
        true,
        trigger,
        triggerType,
        action,
        actionType);

    return rule;
}