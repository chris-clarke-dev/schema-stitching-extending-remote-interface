# GraphQL [Schema Stitching](https://www.graphql-tools.com/docs/schema-stitching/) - Extending a remote interface

Project structure inspired by [schema-stitching-handbook](https://github.com/gmac/schema-stitching-handbook)

This example demonstrates a service that extends an interface and all implementing types with a new field.

## Setup

```shell
cd schema-stitching-extending-interface

yarn install
yarn start
```

## Summary
Visit the [stitched gateway](http://localhost:4000/graphql) and try running the following query:

```graphql
query {
  products(ids: ["p1", "b1", "s1"]) {
    __typename
    id
    notes
    ... on Phone {
      screenType
      processor
    }
    ... on Book {
      author
      name
    }
    ... on Shirt {
      size
      color
    }
  }
}
```

The Product service defines a `Product` interface and the types that implement that interface (`Phone`, `Book`, `Shirt`).

The Notes service extends the `Product` interface with a `notes` field.

So when the above query is run the `notes` field is coming from the Notes service, and all other product information comes from the Products service.

## Issues with this implementation
For Notes service to be able to serve valid GraphQL responses it needs to be aware of all possible types that implement the `Product` interface so it can resolve to those implementing types.

Potential Solutions/Workarounds:
1. Notes service introspects types from other services or other type/schema registry. Downside is that any service could implement new `Product` types, so this would potentially need to introspect every service. It would be ideal if the Notes service did not need to be aware of any other service in the first place.
2. Use REST endpoints, not GraphQL for the Notes service to get around the GraphQL restriction. This would make the Notes service simpler, but the gateway would still need to implement the graphql schema and resolvers locally.
3. Since the gateway is already aware of all types, create some sort of new schema stitching directive/merge config that tells the gateway to extend all types that implement the given interface with the new field. This would likely involve Notes service in this example to implement some placeholder `Product` type so it can still resolve to a type, but then the gateway handles transforming that placeholder type into the correct type.
