## Basic CMD

```
npm install # install all packages
npm run dev # start to run dev server
```

## Have your own Env

1. You should have a [laf](https://laf.dev/) account and download VSCode Extension “laf-assistant”
   1. then you should configure your vscode extension by following this extension guide.
   2. after that, use “上传所有云函数” let your function to enable in your cloud laf environment.
   3. Then your function can be useful.

2. You should have your github a new oauth apps(you can google how to get your github oauth apps if you don’t know how to use it.)
   1. get your github id and your github secret.

3. Add a new file called `.env.local` in your root

   ```
   # .env.local
   # GitHub
   NEXT_PUBLIC_GITHUB_ID =
   GITHUB_SECRET =


   # Your laf host url but `https:`start
   HOST =

   # Your laf host url but `wss:` start
   NEXT_PUBLIC_WS_URL =
   ```

4. That’s all,you can dev right now.
