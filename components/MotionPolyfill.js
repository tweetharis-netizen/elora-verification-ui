import React, { forwardRef } from 'react';

// Basic Motion Component Polyfill
const MotionComponent = (tag) => forwardRef(({ children, className, animate, initial, exit, transition, whileHover, ...props }, ref) => {
    const Component = tag;
    // We retain className and normal props. 
    // We ignore animation props to prevent React unknown prop warnings, 
    // or we could pass them if we wanted to implement CSS transitions.
    // For now, we simply render the component.
    return (
        <Component ref={ref} className={className} {...props}>
            {children}
        </Component>
    );
});

export const motion = {
    div: MotionComponent('div'),
    span: MotionComponent('span'),
    p: MotionComponent('p'),
    h1: MotionComponent('h1'),
    h2: MotionComponent('h2'),
    h3: MotionComponent('h3'),
    button: MotionComponent('button'),
    a: MotionComponent('a'),
    ul: MotionComponent('ul'),
    li: MotionComponent('li'),
    // Add others if needed
};

// AnimatePresence Polyfill - just renders children
export const AnimatePresence = ({ children, mode }) => {
    return <>{children}</>;
};
