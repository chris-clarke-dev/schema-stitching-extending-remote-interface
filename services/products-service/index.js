const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const NotFoundError = require('../../lib/not_found_error');
const { stitchingDirectives, } = require('@graphql-tools/stitching-directives');

const { stitchingDirectivesTypeDefs, stitchingDirectivesValidator, } = stitchingDirectives();

const products = [
  { id: 'p1', __typename: 'Phone', screenType: 'LED', processor: 'A14 Bionic Apple'},
  { id: 'p2', __typename: 'Phone', screenType: 'OLED', processor: 'Snapdragon 888 Qualcomm'},
  { id: 'b1', __typename: 'Book', name: 'The Fellowship of the Ring', author: 'J. R. R. Tolkien'},
  { id: 'b2', __typename: 'Book', name: "The Hitchhiker's Guide to the Galaxy", author: 'Douglas Adams'},
  { id: 's1', __typename: 'Shirt', size: 'Medium', color: 'Blue'},
  { id: 's2', __typename: 'Shirt', size: 'Small', color: 'Red'},
];

const typeDefs = `
${stitchingDirectivesTypeDefs}

interface Product {
  id: ID
}

type Phone implements Product {
  id: ID
  screenType: String
  processor: String
}
type Book implements Product {
  id: ID
  name: String
  author: String
}

type Shirt implements Product {
  id: ID
  size: String
  color: String
}

type Query {
  products(ids: [ID]): [Product]
  _sdl: String!
}
`

const schema = makeExecutableSchema({
  schemaTransforms: [stitchingDirectivesValidator, ],
  typeDefs,
  resolvers: {
    Query: {
      products: (_, { ids }) => ids.map(id => products.find(p => p.id === id) || new NotFoundError()),
      _sdl: () => typeDefs,
    }
  }
});

const app = express();
app.use('/graphql', graphqlHTTP({ schema, graphiql: true }));
app.listen(4001, () => console.log('products-service running at http://localhost:4001/graphql'));