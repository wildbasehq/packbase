export const checkIfDateIsNewer = (newDate: number, lastDate: number) => {
    return new Promise<{
        isNewer: boolean,
        diff: {
            unit: string,
            value: number
        }
    }>((resolve, reject) => {
        if (newDate >= lastDate) {
            const diff = dateDifference(newDate, lastDate);
            resolve({
                isNewer: true,
                diff: diff
            });
        } else {
            resolve({
                isNewer: false,
                diff: {
                    unit: 'seconds',
                    value: 0
                }
            });
        }
    });
}

export function dateDifference(date1: Date | number, date2: Date | number = new Date(), buildString = false): {
    unit: string,
    value: number
} {
    // Check if date1 and date2 are numbers, if not, convert them to numbers
    date1 = typeof date1 === 'number' ? date1 : new Date(date1).getTime();
    date2 = typeof date2 === 'number' ? date2 : new Date(date2).getTime();

    const timeDiff = Math.abs(date1 - date2);
    const secondsDiff = Math.ceil(timeDiff / (1000));
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));
    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const weeksDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
    const monthsDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7 * 4));
    const yearsDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7 * 4 * 12));

    let unit;
    let value;

    if (secondsDiff < 60) {
        unit = secondsDiff === 1 ? 'second' : 'seconds';
        value = secondsDiff;
    } else if (minutesDiff < 60) {
        unit = minutesDiff === 1 ? 'minute' : 'minutes';
        value = minutesDiff;
    } else if (hoursDiff < 24) {
        unit = hoursDiff === 1 ? 'hour' : 'hours';
        value = hoursDiff;
    } else if (daysDiff < 7) {
        unit = daysDiff === 1 ? 'day' : 'days';
        value = daysDiff;
    } else if (weeksDiff < 4) {
        unit = weeksDiff === 1 ? 'week' : 'weeks';
        value = weeksDiff;
    } else if (monthsDiff < 12) {
        unit = monthsDiff === 1 ? 'month' : 'months';
        value = monthsDiff;
    } else {
        unit = yearsDiff === 1 ? 'year' : 'years';
        value = yearsDiff;
    }

    if (buildString) {
        return {
            value,
            unit: `${value} ${unit} ago`
        };
    } else {
        return {
            value,
            unit
        };
    }
}
