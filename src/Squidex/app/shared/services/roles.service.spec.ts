/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';

import {
    AnalyticsService,
    ApiUrlConfig,
    RoleDto,
    RolesDto,
    RolesService,
    Version
} from './../';

describe('RolesService', () => {
    const version = new Version('1');

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule
            ],
            providers: [
                RolesService,
                { provide: ApiUrlConfig, useValue: new ApiUrlConfig('http://service/p/') },
                { provide: AnalyticsService, useValue: new AnalyticsService() }
            ]
        });
    });

    afterEach(inject([HttpTestingController], (httpMock: HttpTestingController) => {
        httpMock.verify();
    }));

    it('should make get request to get all permissions',
        inject([RolesService, HttpTestingController], (roleService: RolesService, httpMock: HttpTestingController) => {

        let permissions: string[];

        roleService.getPermissions('my-app').subscribe(result => {
            permissions = result;
        });

        const req = httpMock.expectOne('http://service/p/api/apps/my-app/roles/permissions');

        expect(req.request.method).toEqual('GET');
        expect(req.request.headers.get('If-Match')).toBeNull();

        req.flush(['P1', 'P2']);

        expect(permissions!).toEqual(['P1', 'P2']);
    }));

    it('should make get request to get roles',
        inject([RolesService, HttpTestingController], (roleService: RolesService, httpMock: HttpTestingController) => {

        let roles: RolesDto;

        roleService.getRoles('my-app').subscribe(result => {
            roles = result;
        });

        const req = httpMock.expectOne('http://service/p/api/apps/my-app/roles');

        expect(req.request.method).toEqual('GET');
        expect(req.request.headers.get('If-Match')).toBeNull();

        req.flush({
            roles: [{
                name: 'Role1',
                numClients: 3,
                numContributors: 5,
                permissions: ['P1']
            }, {
                name: 'Role2',
                numClients: 7,
                numContributors: 9,
                permissions: ['P2']
            }]
        }, {
            headers: {
                etag: '2'
            }
        });

        expect(roles!).toEqual(
            new RolesDto([
                new RoleDto('Role1', 3, 5, ['P1']),
                new RoleDto('Role2', 7, 9, ['P2'])
            ],
            new Version('2')));
    }));

    it('should make post request to add role',
        inject([RolesService, HttpTestingController], (roleService: RolesService, httpMock: HttpTestingController) => {

        const dto = { name: 'Role3' };

        let role: RoleDto;

        roleService.postRole('my-app', dto, version).subscribe(result => {
            role = result.payload;
        });

        const req = httpMock.expectOne('http://service/p/api/apps/my-app/roles');

        expect(req.request.method).toEqual('POST');
        expect(req.request.headers.get('If-Match')).toEqual(version.value);

        req.flush({});

        expect(role!).toEqual(new RoleDto('Role3', 0, 0, []));
    }));

    it('should make put request to update role',
        inject([RolesService, HttpTestingController], (roleService: RolesService, httpMock: HttpTestingController) => {

        const dto = { permissions: ['P4', 'P5'] };

        roleService.putRole('my-app', 'role1', dto, version).subscribe();

        const req = httpMock.expectOne('http://service/p/api/apps/my-app/roles/role1');

        expect(req.request.method).toEqual('PUT');
        expect(req.request.headers.get('If-Match')).toEqual(version.value);

        req.flush({});
    }));

    it('should make delete request to remove role',
        inject([RolesService, HttpTestingController], (roleService: RolesService, httpMock: HttpTestingController) => {

        roleService.deleteRole('my-app', 'role1', version).subscribe();

        const req = httpMock.expectOne('http://service/p/api/apps/my-app/roles/role1');

        expect(req.request.method).toEqual('DELETE');
        expect(req.request.headers.get('If-Match')).toEqual(version.value);

        req.flush({});
    }));
});