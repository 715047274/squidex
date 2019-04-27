/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { of } from 'rxjs';
import { IMock, It, Mock, Times } from 'typemoq';

import {
    DialogService,
    PatternDto,
    PatternsDto,
    PatternsService,
    PatternsState,
    Versioned
} from './../';

import { TestValues } from './_test-helpers';

describe('PatternsState', () => {
    const {
        app,
        appsState,
        newVersion,
        version
    } = TestValues;

    const oldPatterns = [
        new PatternDto('id1', 'name1', 'pattern1', ''),
        new PatternDto('id2', 'name2', 'pattern2', '')
    ];

    let dialogs: IMock<DialogService>;
    let patternsService: IMock<PatternsService>;
    let patternsState: PatternsState;

    beforeEach(() => {
        dialogs = Mock.ofType<DialogService>();

        patternsService = Mock.ofType<PatternsService>();
        patternsState = new PatternsState(patternsService.object, appsState.object, dialogs.object);
    });

    afterEach(() => {
        patternsService.verifyAll();
    });

    describe('Loading', () => {
        it('should load patterns', () => {
            patternsService.setup(x => x.getPatterns(app))
                .returns(() => of(new PatternsDto(oldPatterns, version))).verifiable();

            patternsState.load().subscribe();

            expect(patternsState.snapshot.patterns.values).toEqual(oldPatterns);
            expect(patternsState.snapshot.version).toEqual(version);

            dialogs.verify(x => x.notifyInfo(It.isAnyString()), Times.never());
        });

        it('should show notification on load when reload is true', () => {
            patternsService.setup(x => x.getPatterns(app))
                .returns(() => of(new PatternsDto(oldPatterns, version))).verifiable();

            patternsState.load(true).subscribe();

            expect().nothing();

            dialogs.verify(x => x.notifyInfo(It.isAnyString()), Times.once());
        });
    });

    describe('Updates', () => {
        beforeEach(() => {
            patternsService.setup(x => x.getPatterns(app))
                .returns(() => of(new PatternsDto(oldPatterns, version))).verifiable();

            patternsState.load().subscribe();
        });

        it('should add pattern to snapshot when created', () => {
            const newPattern = new PatternDto('id3', 'name3', 'pattern3', '');

            const request = { ...newPattern };

            patternsService.setup(x => x.postPattern(app, request, version))
                .returns(() => of(new Versioned(newVersion, newPattern))).verifiable();

            patternsState.create(request).subscribe();

            expect(patternsState.snapshot.patterns.values).toEqual([...oldPatterns, newPattern]);
            expect(patternsState.snapshot.version).toEqual(newVersion);
        });

        it('should update properties when updated', () => {
            const request = { name: 'name2_1', pattern: 'pattern2_1', message: 'message2_1' };

            patternsService.setup(x => x.putPattern(app, oldPatterns[1].id, request, version))
                .returns(() => of(new Versioned(newVersion, {}))).verifiable();

            patternsState.update(oldPatterns[1], request).subscribe();

            const pattern_1 = patternsState.snapshot.patterns.at(1);

            expect(pattern_1.name).toBe(request.name);
            expect(pattern_1.pattern).toBe(request.pattern);
            expect(pattern_1.message).toBe(request.message);
            expect(patternsState.snapshot.version).toEqual(newVersion);
        });

        it('should remove pattern from snapshot when deleted', () => {
            patternsService.setup(x => x.deletePattern(app, oldPatterns[0].id, version))
                .returns(() => of(new Versioned(newVersion, {}))).verifiable();

            patternsState.delete(oldPatterns[0]).subscribe();

            expect(patternsState.snapshot.patterns.values).toEqual([oldPatterns[1]]);
            expect(patternsState.snapshot.version).toEqual(newVersion);
        });
    });
});