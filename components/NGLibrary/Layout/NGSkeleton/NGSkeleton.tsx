'use client';
import {ReactNode, useEffect, useState} from 'react';
import {buildClassObject} from "@/lib/ColourScheme.utils";
import Image from 'next/image';
import styles from './NGSkeleton.module.scss';

export declare interface NGSkeletonType {
    dontAlternate?: boolean;
    theme?: any;
    children?: ReactNode;
}

export const NGSkeletonTheming = {
    main: [styles.item, 'p-8', 'dark:bg-neutral-800/50'],
}

export default function NGSkeleton({...props}: NGSkeletonType) {
    let theme = buildClassObject(NGSkeletonTheming, props.theme || undefined)
    const [classes, setClasses] = useState(styles.itemIn);
    const [order, setOrder] = useState(['32', '48', '40', '56']);
    const [loopCount, setLoopCount] = useState(1);

    useEffect(() => {
        let i = 1;
        let orderArray = shuffle(order);
        const animation = () => {
            setClasses(styles.itemOut);
            setTimeout(() => {
                if (!props.dontAlternate) {
                    orderArray = shuffle(order);
                    setOrder(orderArray);
                }

                setClasses(styles.itemIn);

                if (i === 4) {
                    setLoopCount(1);
                    i = 1;
                } else {
                    setLoopCount(i + 1);
                    i++;
                }
            }, 500);
        };

        animation();
        const interval = setInterval(animation, 1000);

        return () => clearInterval(interval);
    }, [props.dontAlternate]);

    // Courtesy of https://stackoverflow.com/a/2450976/10520947
    function shuffle(array: string[]) {
        let currentIndex = array.length, randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {

            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    return (
        <div className="flex flex-col space-y-6 overflow-hidden">
            <div className={`h-${order[0]} ${theme.main} ${classes}`}></div>
            <div className={`h-${order[1]} ${theme.main} ${classes}`}>
                {!props.dontAlternate && loopCount === 4 && (
                    <div className="h-full relative space-y-4">
                        <Image src={`/img/illustrations/onboarding/gray-cat.png`}
                               width={200}
                               height={200}
                               alt="Gray Cat"
                               className="h-full w-auto"/>
                    </div>
                )}
            </div>
            <div className={`h-${order[2]} ${theme.main} ${classes}`}></div>
            <div className={`h-${order[3]} ${theme.main} ${classes}`}></div>
        </div>
    );
}
