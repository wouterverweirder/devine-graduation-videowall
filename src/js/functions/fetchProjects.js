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
            experience,
            lifeLesson,
            website,
            quote,
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
            mainAsset {
              data {
                id,
                attributes {
                  url,
                  width,
                  height,
                  mime
                }
              }
            }
          }
        }
      }
    }
  `;
  console.log('frontend-graphql-url', argv['frontend-graphql-url']);
  // always fetch local
  let projects = await (await fetch(argv['frontend-graphql-url'], {
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

export {
  fetchProjects
}