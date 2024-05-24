import React, {useState} from 'react';
// @ts-ignore
import {buildClassObject} from '@/lib/ColourScheme.utils';

export declare interface NGHeadingType {
    className?: string;
    theme?: any;
    children?: React.ReactNode;
}

export const NGHeadingTheming = {
    main: ['text-ColourScheme-500'],
}

export default function NGHeading({...props}: NGHeadingType) {
    let theme = buildClassObject(NGHeadingTheming, props.theme || undefined)

    return (
        <h1 className={`text-2xl font-bold ${props.theme ? theme.main : 'text-default'} ${props.className}`}>
            {props.children}
        </h1>
    );
}
