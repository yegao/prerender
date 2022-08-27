# prerender
为解决`SPA`的`SEO`问题而实现的预渲染器。

### 原因
目前流行的`SPA`应用存在`SEO`不好的问题，虽然提供了一些`SSR`和`SSG`方案，但都存在一些弊端，想要做到稳定高可用绝非易事。

将组件渲染逻辑从客户端改到服务器执行，计算资源的成本必须考虑在内

> Most importantly, SSR React apps cost a lot more in terms of resources since you need to keep a Node server up and running.

与客户端程序相比，服务端程序对稳定性和性能的要求严苛得多，因此这里考虑实现一种在客户端，源码编译阶段将SPA的结果预先渲染为静态文件的方案。

通过`UA`判定请求是否来自爬虫，选择访问真实的`SPA`内容还是`prerender`生成的静态结果。


#### prender-gen的使用方式
比如你正在编写一个`SPA`应用，然后希望生成当前react的静态页面，易于`SEO`，可以使用prender-gen。
* 第一步 打开自己的项目目录。
* 本地启动项目服务。
    比如你的项目`gameApp`是使用`create-react-app`创建的，一般可以在目录`gameApp`下执行`npm start`开启`http://localhost:3000`服务。
* 新建一个配置文件，内容是静态文件存放路径和地址的映射。

例如可以在项目`gameApp`根目录下创建一个`prerender.json`文件，填入如下内容。

```json
{
    "./dist/shtml/home": "http://localhost:3000/home",
    "./dist/shtml/playground":"http://localhost:3000/playground",
    "./dist/shtml/setting/role":"http://localhost:3000/setting/role",
    "./dist/shtml/setting/music":"http://localhost:3000/setting/music"
}
```

* 在当前路径创建另一个终端，运行`npx prerender-gen`命令
```
Usage: prerender-gen [options]

Options:
  -d, --dir [dirname]  读取指定文件夹中的prerender.json中的路由配置
  -o, --out [outdir]   输出预渲染文件的存放目录
  -h, --help           display help for command
```
例如
```
pre
```

#### prerender-render使用方式

prerender-render会启动一个`koa`服务，默认端口为`8900`，可以爬取到其他页面的静态内容并展示。

```
GET localhost:8900/https://www.book.family.ink/webgl/basic
```
