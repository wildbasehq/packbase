import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import NGHeading from './NGHeading';

// @ts-ignore
describe('<NGHeading />', () => {
    // @ts-ignore
    test('it should mount', () => {
        render(<NGHeading/>);

        const test = screen.getByTestId('Test');

        // @ts-ignore
        expect(test).toBeInTheDocument();
    });
});
