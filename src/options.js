export const options = [
  {
    name: 'devtools',
    value: {
      description: 'Open devtools',
      type: 'boolean',
      default: false
    },
  },
  {
    name: 'editor',
    value: {
      description: 'Open editor',
      type: 'boolean',
      default: false
    },
  },
  {
    name: 'only-server',
    value: {
      description: 'Run server only',
      type: 'boolean',
      default: false
    },
  },
  {
    name: 'projection',
    value: {
      description: 'Choose a projection mode',
      choices: ['multi', 'single'],
      default: 'single'
    },
  },
  {
    name: 'websocket',
    value: {
      description: 'hostname of websocket server',
      type: 'string',
      default: null
    },
  },
  {
    name: 'frontend-graphql-url',
    value: {
      description: 'URL of the graphql endpoint the frontend uses',
      type: 'string',
      default: '/graphql'
    },
  },
  {
    name: 'cms-graphql-url',
    value: {
      description: 'URL of the graphql endpoint the local server uses to sync - e.g. https://howest-videowall.herokuapp.com/graphql',
      type: 'string',
      default: null
    },
  },
];