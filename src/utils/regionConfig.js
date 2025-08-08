// Region pricing configuration
const REGION_CONFIG = {
    'Greater Accra Region': {
        defaultFee: 40,
        availableAreas: {
            'tema': { fee: 60, name: 'Tema' },
            'accra': { fee: 40, name: 'Accra' }
        },
        defaultArea: 'accra'
    },
    'Central Region': {
        defaultFee: 70,
        availableAreas: {
            'kasoa': { fee: 60, name: 'Kasoa' }
        },
        defaultArea: 'kasoa'
    },
};

export default REGION_CONFIG;