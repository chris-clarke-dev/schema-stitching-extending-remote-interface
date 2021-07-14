const waitOn = require('wait-on');
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { stitchSchemas } = require('@graphql-tools/stitch');
const { buildSchema } = require('graphql');
const { stitchingDirectives } = require('@graphql-tools/stitching-directives');
const { stitchingDirectivesTransformer } = stitchingDirectives();

const makeRemoteExecutor = require('./lib/make_remote_executor');

async function makeGatewaySchema() {
  const productsServiceExec = makeRemoteExecutor('http://localhost:4001/graphql');
  const notesServiceExec = makeRemoteExecutor('http://localhost:4002/graphql');

  return stitchSchemas({
    subschemaConfigTransforms: [stitchingDirectivesTransformer],
    subschemas: [
      {
        schema: buildSchema(await fetchRemoteSDL(productsServiceExec)),
        executor: productsServiceExec,
      },
      {
        schema: buildSchema(await fetchRemoteSDL(notesServiceExec)),
        executor: notesServiceExec,
      },
    ],
  });
}

async function fetchRemoteSDL(executor) {
  const result = await executor({ document: '{ _sdl }' });
  return result.data._sdl;
}

waitOn({ resources: ['tcp:4001', 'tcp:4002'] }, async (err) => {
  const schema = await makeGatewaySchema();
  const app = express();
  app.use('/graphql', graphqlHTTP((req) => ({
    schema,
    context: { authHeader: req.headers.authorization },
    graphiql: true
  })));
  app.listen(4000, () => console.log('gateway running at http://localhost:4000/graphql'));
})
