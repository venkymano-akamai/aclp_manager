import { UPDATE_LINODES, UPDATE_LINODE, LINODE_PENDING } from '../actions/linodes';

const default_state = {
    localPage: -1,
    remotePage: 0,
    loading: false,
    linodes: []
};

function transformLinode(linode) {
    return {
        _pending: false,
        ...linode
    };
}

export default function linodes(state=default_state, action) {
    switch (action.type) {
    case UPDATE_LINODES:
        const { response } = action;
        return {
            ...state,
            localPage: response.page,
            remotePage: response.page,
            linodes: response.linodes.map(transformLinode)
        };
    case UPDATE_LINODE:
        const linode = action.response;
        return {
            ...state,
            linodes: state.linodes.map(l => {
                if (l.id !== linode.id) {
                    return l;
                }
                return transformLinode(linode);
            })
        };
    case LINODE_PENDING:
    {
        const { linode, pending } = action;
        return {
            ...state,
            linodes: state.linodes.map(l => {
                if (l.id !== linode.id) {
                    return l;
                }
                return { ...l, _pending: pending };
            })
        };
    }
    default:
        return state;
    }
}
