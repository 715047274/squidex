/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { of } from 'rxjs';
import { IMock, It, Mock, Times } from 'typemoq';

import {
    ClientDto,
    ClientsDto,
    ClientsService,
    ClientsState,
    DialogService,
    Versioned
} from './../';

import { TestValues } from './_test-helpers';

describe('ClientsState', () => {
    const {
        app,
        appsState,
        newVersion,
        version
    } = TestValues;

    const oldClients = [
        new ClientDto('id1', 'name1', 'secret1'),
        new ClientDto('id2', 'name2', 'secret2')
    ];

    let dialogs: IMock<DialogService>;
    let clientsService: IMock<ClientsService>;
    let clientsState: ClientsState;

    beforeEach(() => {
        dialogs = Mock.ofType<DialogService>();

        clientsService = Mock.ofType<ClientsService>();

        clientsService.setup(x => x.getClients(app))
            .returns(() => of(new ClientsDto(oldClients, version))).verifiable(Times.atLeastOnce());

        clientsState = new ClientsState(clientsService.object, appsState.object, dialogs.object);
        clientsState.load().subscribe();
    });

    afterEach(() => {
        clientsService.verifyAll();
    });

    it('should load clients', () => {
        expect(clientsState.snapshot.clients.values).toEqual(oldClients);
        expect(clientsState.snapshot.version).toEqual(version);
        expect(clientsState.isLoaded).toBeTruthy();

        dialogs.verify(x => x.notifyInfo(It.isAnyString()), Times.never());
    });

    it('should show notification on load when reload is true', () => {
        clientsState.load(true).subscribe();

        expect().nothing();

        dialogs.verify(x => x.notifyInfo(It.isAnyString()), Times.once());
    });

    it('should add client to snapshot when created', () => {
        const newClient = new ClientDto('id3', 'name3', 'secret3');

        const request = { id: 'id3' };

        clientsService.setup(x => x.postClient(app, request, version))
            .returns(() => of(new Versioned(newVersion, newClient))).verifiable();

        clientsState.attach(request).subscribe();

        expect(clientsState.snapshot.clients.values).toEqual([...oldClients, newClient]);
        expect(clientsState.snapshot.version).toEqual(newVersion);
    });

    it('should update properties when updated', () => {
        const request = { name: 'NewName', role: 'NewRole' };

        clientsService.setup(x => x.putClient(app, oldClients[0].id, request, version))
            .returns(() => of(new Versioned(newVersion, {}))).verifiable();

        clientsState.update(oldClients[0], request).subscribe();

        const client_1 = clientsState.snapshot.clients.at(0);

        expect(client_1.name).toBe('NewName');
        expect(client_1.role).toBe('NewRole');
        expect(clientsState.snapshot.version).toEqual(newVersion);
    });

    it('should remove client from snapshot when revoked', () => {
        clientsService.setup(x => x.deleteClient(app, oldClients[0].id, version))
            .returns(() => of(new Versioned(newVersion, {}))).verifiable();

        clientsState.revoke(oldClients[0]).subscribe();

        expect(clientsState.snapshot.clients.values).toEqual([oldClients[1]]);
        expect(clientsState.snapshot.version).toEqual(newVersion);
    });
});