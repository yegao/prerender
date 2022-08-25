# prerender

### 原因
目前流行的`SPA`应用存在`SEO`不好的问题，虽然提供了一些`SSR`和`SSG`方案，但都存在一些弊端，想要做到稳定高可用绝非易事。

将组件渲染逻辑从客户端改到服务器执行，计算资源的成本必须考虑在内

> Most importantly, SSR React apps cost a lot more in terms of resources since you need to keep a Node server up and running.

与客户端程序相比，服务端程序对稳定性和性能的要求严苛得多，因此这里考虑实现一种在客户端，源码编译阶段将SPA的结果预先渲染为静态文件的方案。

通过`UA`判定请求是否来自爬虫，选择访问真实的SPA内容还是静态结果。

### 使用方式

```
GET localhost:8900/https://www.example.com/a/b/c
```
