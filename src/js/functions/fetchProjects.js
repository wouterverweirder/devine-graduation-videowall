const fetchProjects = async (argv) => {
  const query = `# Write your query or mutation here
    query{
      students(pagination: { page: 1, pageSize: 100 }){
        data {
          id,
          attributes {
            firstName,
            lastName,
            curriculum {
              data {
                id,
                attributes {
                  name
                  image {
                    data {
                      attributes {
                        url,
                        width,
                        height,
                        mime
                      }
                    }
                  }
                  pillar {
                    data {
                      attributes {
                        name
                        color
                      }
                    }
                  }
                }
              }
            },
            bio,
            website,
            profilePicture {
              data {
                id,
                attributes {
                  url,
                  width,
                  height,
                  mime
                }
              }
            },
            quote
          }
        }
      }
    }
  `;
  let projects = await (await fetch(`${getServerURL(argv)}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
      },
    }),
  })).json();
  // sync assets locally
  if (window.VideoWallAPI) {
    projects = await window.VideoWallAPI.processProjects(projects, argv);
  }
  return projects;
}

const getServerURL = (argv) => {
  if (argv['server-url']) {
    return argv['server-url'];
  }
  if (window.location.protocol === 'http:') {
    return '';
  }
  return `http://${getServerAddress()}`;
}

const getServerAddress = () => {
  if (window.location.protocol === 'http:') {
    return window.location.hostname;
  }
  return '127.0.0.1';
}

export {
  fetchProjects,
  getServerURL,
  getServerAddress
}