const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const NotFoundError = require('../../lib/not_found_error');
const { stitchingDirectives, } = require('@graphql-tools/stitching-directives');

const { stitchingDirectivesTypeDefs, stitchingDirectivesValidator, } = stitchingDirectives()

// This is the biggest problem with this impementation. This service needs to be aware of all 
// implementing types so that it can extend them all with the new interface field.
const productTypes = ['Phone', 'Book', 'Shirt'];
const productTypeDefs = productTypes.map(type => (`
type ${type} implements Product {
  id: ID
  notes: [String]
}`))

const typeDefs = `
${stitchingDirectivesTypeDefs}

interface Product {
  id: ID
  notes: [String]
}

${productTypeDefs}

type Query {
  _product(id: ID!): Product @merge(keyField: "id")
  _sdl: String!
}
`

const notes = [
  { id: 'p1', __typename: 'Phone', notes: ['Newer model coming in Q4 2021', 'Eligible for rebate']},
  { id: 'b2', __typename: 'Book', notes: ["DON'T PANIC"]},
  { id: 's1', __typename: 'Shirt', notes: ['A comphy shirt']},
];

const schema = makeExecutableSchema({
  schemaTransforms: [stitchingDirectivesValidator, ],
  typeDefs,
  resolvers: {
    Query: {
      // Another downside with this is if the product wasn't found, your only option is to return null.
      // You can't return a default value like an empty array because this doesn't know the type to resolve to.
      // Which also means you can't enforce non-null types for any extended field.
      _product: (_, { id }) => notes.find(n => n.id === id),
      _sdl: () => typeDefs,
    },
  },
  inheritResolversFromInterfaces: true,
});

const app = express();
app.use('/graphql', graphqlHTTP({ schema, graphiql: true }));
app.listen(4002, () => console.log('notes-service running at http://localhost:4002/graphql'));