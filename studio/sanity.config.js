import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

// Define which document types should be singletons
const singletonActions = new Set(["publish", "discardChanges", "restore"])
const singletonTypes = new Set(["hero", "about", "footer", "contact"])

export default defineConfig({
  name: 'default',
  title: 'Portfolio Studio',
  basePath: '/studio',

  projectId: 'uefti8ya',
  dataset: 'production',

  plugins: [
    deskTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            // Singletons
            S.listItem()
              .title("Hero Section")
              .id("hero")
              .child(
                S.document()
                  .schemaType("hero")
                  .documentId("hero")
              ),
            S.listItem()
              .title("About Section")
              .id("about")
              .child(
                S.document()
                  .schemaType("about")
                  .documentId("about")
              ),
            S.listItem()
              .title("Contact Section")
              .id("contact")
              .child(
                S.document()
                  .schemaType("contact")
                  .documentId("contact")
              ),
            S.listItem()
              .title("Footer Settings")
              .id("footer")
              .child(
                S.document()
                  .schemaType("footer")
                  .documentId("footer")
              ),
            
            S.divider(),
            
            // Regular document types
            ...S.documentTypeListItems().filter(
              (listItem) => !singletonTypes.has(listItem.getId())
            ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    // Filter out singleton types from the global "create new" menu
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },

  document: {
    // For singleton types, filter out actions that are not explicitly allowed
    // (e.g., delete, unpublish, duplicate)
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(({ action }) => action && singletonActions.has(action))
        : input,
  },
})
