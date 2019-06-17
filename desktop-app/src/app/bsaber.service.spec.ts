import { TestBed } from '@angular/core/testing';

import { BsaberService } from './bsaber.service';

describe('BsaberService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: BsaberService = TestBed.get(BsaberService);
        expect(service).toBeTruthy();
    });
});
