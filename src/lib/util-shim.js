// Custom polyfill for util.inspect required by openid-client on Edge
export const inspect = {
    custom: Symbol.for('nodejs.util.inspect.custom'),
};

export default {
    inspect,
};
