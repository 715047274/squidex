/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { of, throwError } from 'rxjs';
import { IMock, It, Mock, Times } from 'typemoq';

import { DialogService } from '@app/shared';

import { EventConsumerDto, EventConsumersService } from './../services/event-consumers.service';
import { EventConsumersState } from './event-consumers.state';

describe('EventConsumersState', () => {
    const oldConsumers = [
        new EventConsumerDto('name1', false),
        new EventConsumerDto('name2', true)
    ];

    let dialogs: IMock<DialogService>;
    let eventConsumersService: IMock<EventConsumersService>;
    let eventConsumersState: EventConsumersState;

    beforeEach(() => {
        dialogs = Mock.ofType<DialogService>();

        eventConsumersService = Mock.ofType<EventConsumersService>();

        eventConsumersService.setup(x => x.getEventConsumers())
            .returns(() => of(oldConsumers));

        eventConsumersState = new EventConsumersState(dialogs.object, eventConsumersService.object);
        eventConsumersState.load().subscribe();
    });

    it('should load event consumers', () => {
        expect(eventConsumersState.snapshot.eventConsumers.values).toEqual(oldConsumers);
        expect(eventConsumersState.snapshot.isLoaded).toBeTruthy();

        expect().nothing();

        dialogs.verify(x => x.notifyInfo(It.isAnyString()), Times.never());
    });

    it('should show notification on load when reload is true', () => {
        eventConsumersState.load(true);

        expect().nothing();

        dialogs.verify(x => x.notifyInfo(It.isAnyString()), Times.once());
    });

    it('should show notification on load error when silent is false', () => {
        eventConsumersService.setup(x => x.getEventConsumers())
            .returns(() => throwError({}));

        eventConsumersState.load(true, false);

        expect().nothing();

        dialogs.verify(x => x.notifyError(It.isAny()), Times.once());
    });

    it('should not show notification on load error when silent is true', () => {
        eventConsumersService.setup(x => x.getEventConsumers())
            .returns(() => throwError({}));

        eventConsumersState.load(true, true);

        expect().nothing();

        dialogs.verify(x => x.notifyError(It.isAny()), Times.never());
    });

    it('should unmark as stopped when started', () => {
        eventConsumersService.setup(x => x.putStart(oldConsumers[1].name))
            .returns(() => of({}));

        eventConsumersState.start(oldConsumers[1]);

        const es_1 = eventConsumersState.snapshot.eventConsumers.at(1);

        expect(es_1.isStopped).toBeFalsy();
    });

    it('should mark as stopped when stopped', () => {
        eventConsumersService.setup(x => x.putStop(oldConsumers[0].name))
            .returns(() => of({}));

        eventConsumersState.stop(oldConsumers[0]);

        const es_1 = eventConsumersState.snapshot.eventConsumers.at(0);

        expect(es_1.isStopped).toBeTruthy();
    });

    it('should mark as resetting when reset', () => {
        eventConsumersService.setup(x => x.putReset(oldConsumers[0].name))
            .returns(() => of({}));

        eventConsumersState.reset(oldConsumers[0]);

        const es_1 = eventConsumersState.snapshot.eventConsumers.at(0);

        expect(es_1.isResetting).toBeTruthy();
    });
});