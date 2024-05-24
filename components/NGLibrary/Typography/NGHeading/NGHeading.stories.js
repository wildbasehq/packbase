/* eslint-disable */
import React from 'react';
import NGHeading from './NGHeading';

export default {
    title: 'NGHeading',
    component: NGHeading,
};

const Template = (args) => <NGHeading {...args} />;

export const Default = Template.bind({});
Default.args = {
    children: 'hello world',
};

