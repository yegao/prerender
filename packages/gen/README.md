# @rendify/gen
为解决*SPA*的*SEO*问题而实现的预渲染器。

比如你正在编写一个*SPA*应用，然后希望生成当前react的静态页面，易于*SEO*，可以使用prender-gen。

```
rendify-gen [options]

Options:
  -d, --dir [dirname]  读取指定文件夹中的rendify.json中的路由配置，默认是执行rendify-gen命令所在的路径
```

1. 打开自己的项目目录。

2. 本地启动项目服务。

比如你的项目*gameApp*是使用*create-react-app*创建的，一般可以在目录*gameApp*下执行*npm start*开启*http://localhost:3000*服务。

3. 新建一个配置文件，内容是*静态结果文件*存放路径和地址的映射。

例如可以在项目*gameApp*根目录下创建一个*rendify.json*文件，填入如下内容。

```json
{
    "./build/shtml/home.html": "http://localhost:3000/home",
    "./build/shtml/playground.html":"http://localhost:3000/playground",
    "./build/shtml/setting/role.html":"http://localhost:3000/setting/role",
    "./build/shtml/setting/music.html":"http://localhost:3000/setting/music"
}
```

4. 在当前路径创建另一个终端，运行*npx rendify-gen*命令。

*./build/shtml/home.html*等文件就会被创建，里面的内容是浏览器访问*http://localhost:3000/home*后的*静态结果*。

> 这些*静态结果文件*后续可以放入服务器，比如使用nginx配置，当访问来源于搜索引擎的爬虫，则提供这些*静态结果文件*。当不是搜索引擎的爬虫的时候访问的时候，提供正常的*SPA*主文件（一般是*index.html*）。

这里提供一个*nginx*配置的例子:

```
server {
    location / {
        index            index.html;
        try_files        $uri @rendify;
    }

    location @rendify {
        set              $rendify 0;
        if ($http_user_agent ~* "googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator") {
            set          $rendify 1;
        }
        if ($args ~ "_escaped_fragment_") {
            set          $rendify 1;
        }
        if ($http_user_agent ~ "rendify") {
            set          $rendify 0;
        }
        if ($uri ~* "\.(js|css|xml|less|png|jpg|jpeg|gif|pdf|doc|txt|ico|rss|zip|mp3|rar|exe|wmv|doc|avi|ppt|mpg|mpeg|tif|wav|mov|psd|ai|xls|mp4|m4a|swf|dat|dmg|iso|flv|m4v|torrent|ttf|woff|svg|eot)") {
            set          $rendify 0;
        }
        resolver         8.8.8.8;
        if ($rendify = 1) {
            proxy_pass   http://render_server/render/$scheme://$host:$server_port$request_uri;
        }
        if ($rendify = 0) {
            rewrite      .* /index.html break;
        }
    }
}
```