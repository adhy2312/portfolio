import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'uefti8ya',
    dataset: 'production'
  },
  project: {
    basePath: '/studio'
  },
  deployment: {
    appId: 'aziwzc6ft85ksn3fwljcmzie'
  }
})
