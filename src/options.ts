export const options:{
  name: string;
  value: {
    description: string;
    type?: 'boolean' | 'string';
    choices?: string[];
    default: boolean | string | null;
  };
}[] = [
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
      default: 'multi'
    },
  },
  {
    name: 'websocket',
    value: {
      description: 'hostname of websocket server',
      type: 'string',
      // default: '127.0.0.1'
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
  {
    name: 'config-json-path',
    value: {
      description: 'relative of the config.json file from the public folder',
      type: 'string',
      default: 'config.json'
    }
  },
  {
    name: 'projectDirectory',
    value: {
      description: 'Directory where the projects are stored',
      type: 'string',
      default: null
    }
  }
];

export type ArgV = Record<string, string | boolean | string[]> & {
  _: string[];
  devtools: boolean;
  editor: boolean;
  'only-server': boolean;
  projection: 'multi' | 'single';
  websocket: string | null;
  'frontend-graphql-url': string;
  'cms-graphql-url': string | null;
  'config-json-path': string;
  projectDirectory: string | null;
};

export const getArgVFromQueryString = ():ArgV => {
  const queryStringObject = Object.fromEntries(new URLSearchParams(window.location.search));
  const argV = options.reduce((acc, option) => {
    const value = queryStringObject[option.name] ?? option.value.default;
    if (option.value.type === 'boolean') {
      acc[option.name] = value === 'true';
    } else if (option.value.type === 'string') {
      acc[option.name] = value;
    } else if (option.value.choices && typeof value === 'string') {
      acc[option.name] = option.value.choices.includes(value) ? value : option.value.default;
    } else {
      acc[option.name] = value;
    }
    return acc;
  }, {} as ArgV);
  return argV;
};