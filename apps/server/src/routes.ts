import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type Route0 from "./routes/D:/dev/korat-hb/apps/server/src/routes/health";
import type Route1 from "./routes/D:/dev/korat-hb/apps/server/src/routes/user/me/badge";
import type Route2 from "./routes/D:/dev/korat-hb/apps/server/src/routes/user/me/friends";
import type Route3 from "./routes/D:/dev/korat-hb/apps/server/src/routes/user/me/index";
import type Route4 from "./routes/D:/dev/korat-hb/apps/server/src/routes/user/me/packs";
import type Route5 from "./routes/D:/dev/korat-hb/apps/server/src/routes/user/me/settings";
import type Route6 from "./routes/D:/dev/korat-hb/apps/server/src/routes/user/me/storage";
import type Route7 from "./routes/D:/dev/korat-hb/apps/server/src/routes/themes/index";
import type Route8 from "./routes/D:/dev/korat-hb/apps/server/src/routes/themes/validate";
import type Route9 from "./routes/D:/dev/korat-hb/apps/server/src/routes/tags/index";
import type Route10 from "./routes/D:/dev/korat-hb/apps/server/src/routes/store/index";
import type Route11 from "./routes/D:/dev/korat-hb/apps/server/src/routes/server/describeServer";
import type Route12 from "./routes/D:/dev/korat-hb/apps/server/src/routes/server/insight";
import type Route13 from "./routes/D:/dev/korat-hb/apps/server/src/routes/server/fwupd/check";
import type Route14 from "./routes/D:/dev/korat-hb/apps/server/src/routes/search/index";
import type Route15 from "./routes/D:/dev/korat-hb/apps/server/src/routes/packs/index";
import type Route16 from "./routes/D:/dev/korat-hb/apps/server/src/routes/pack/create";
import type Route17 from "./routes/D:/dev/korat-hb/apps/server/src/routes/news/index";
import type Route18 from "./routes/D:/dev/korat-hb/apps/server/src/routes/invite/generate";
import type Route19 from "./routes/D:/dev/korat-hb/apps/server/src/routes/invite/list";
import type Route20 from "./routes/D:/dev/korat-hb/apps/server/src/routes/inbox/fetch";
import type Route21 from "./routes/D:/dev/korat-hb/apps/server/src/routes/inbox/index";
import type Route22 from "./routes/D:/dev/korat-hb/apps/server/src/routes/inbox/read";
import type Route23 from "./routes/D:/dev/korat-hb/apps/server/src/routes/howl/create";
import type Route24 from "./routes/D:/dev/korat-hb/apps/server/src/routes/folders/index";
import type Route25 from "./routes/D:/dev/korat-hb/apps/server/src/routes/dm/channels/index";
import type Route26 from "./routes/D:/dev/korat-hb/apps/server/src/routes/dipswitch/index";
import type Route27 from "./routes/D:/dev/korat-hb/apps/server/src/routes/admin/sql";
import type Route28 from "./routes/D:/dev/korat-hb/apps/server/src/routes/user/[username]/follow";
import type Route29 from "./routes/D:/dev/korat-hb/apps/server/src/routes/user/[username]/index";
import type Route30 from "./routes/D:/dev/korat-hb/apps/server/src/routes/user/[username]/theme";
import type Route31 from "./routes/D:/dev/korat-hb/apps/server/src/routes/themes/[id]/index";
import type Route32 from "./routes/D:/dev/korat-hb/apps/server/src/routes/store/[item_id]/index";
import type Route33 from "./routes/D:/dev/korat-hb/apps/server/src/routes/pack/[id]/index";
import type Route34 from "./routes/D:/dev/korat-hb/apps/server/src/routes/pack/[id]/join";
import type Route35 from "./routes/D:/dev/korat-hb/apps/server/src/routes/pack/[id]/members";
import type Route36 from "./routes/D:/dev/korat-hb/apps/server/src/routes/pack/[id]/theme";
import type Route37 from "./routes/D:/dev/korat-hb/apps/server/src/routes/pack/[id]/themes/index";
import type Route38 from "./routes/D:/dev/korat-hb/apps/server/src/routes/pack/[id]/themes/validate";
import type Route39 from "./routes/D:/dev/korat-hb/apps/server/src/routes/pack/[id]/settings/index";
import type Route40 from "./routes/D:/dev/korat-hb/apps/server/src/routes/pack/[id]/pages/index";
import type Route41 from "./routes/D:/dev/korat-hb/apps/server/src/routes/inbox/[id]/index";
import type Route42 from "./routes/D:/dev/korat-hb/apps/server/src/routes/howl/[id]/comment";
import type Route43 from "./routes/D:/dev/korat-hb/apps/server/src/routes/howl/[id]/index";
import type Route44 from "./routes/D:/dev/korat-hb/apps/server/src/routes/howl/[id]/react";
import type Route45 from "./routes/D:/dev/korat-hb/apps/server/src/routes/folder/[id]/index";
import type Route46 from "./routes/D:/dev/korat-hb/apps/server/src/routes/feed/[id]/index";
import type Route47 from "./routes/D:/dev/korat-hb/apps/server/src/routes/dm/messages/[id]/index";
import type Route48 from "./routes/D:/dev/korat-hb/apps/server/src/routes/dm/channels/[id]/index";
import type Route49 from "./routes/D:/dev/korat-hb/apps/server/src/routes/dm/channels/[id]/messages";
import type Route50 from "./routes/D:/dev/korat-hb/apps/server/src/routes/pack/[id]/themes/[theme_id]/index";


    export type Packbase = ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/health", typeof Route0>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/user/me/badge", typeof Route1>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/user/me/friends", typeof Route2>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/user/me", typeof Route3>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/user/me/packs", typeof Route4>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/user/me/settings", typeof Route5>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/user/me/storage", typeof Route6>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/themes", typeof Route7>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/themes/validate", typeof Route8>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/tags", typeof Route9>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/store", typeof Route10>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/server/describeServer", typeof Route11>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/server/insight", typeof Route12>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/server/fwupd/check", typeof Route13>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/search", typeof Route14>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/packs", typeof Route15>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/pack/create", typeof Route16>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/news", typeof Route17>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/invite/generate", typeof Route18>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/invite/list", typeof Route19>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/inbox/fetch", typeof Route20>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/inbox", typeof Route21>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/inbox/read", typeof Route22>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/howl/create", typeof Route23>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/folders", typeof Route24>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/dm/channels", typeof Route25>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/dipswitch", typeof Route26>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/admin/sql", typeof Route27>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/user/:username/follow", typeof Route28>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/user/:username", typeof Route29>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/user/:username/theme", typeof Route30>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/themes/:id", typeof Route31>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/store/:item_id", typeof Route32>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/pack/:id", typeof Route33>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/pack/:id/join", typeof Route34>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/pack/:id/members", typeof Route35>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/pack/:id/theme", typeof Route36>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/pack/:id/themes", typeof Route37>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/pack/:id/themes/validate", typeof Route38>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/pack/:id/settings", typeof Route39>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/pack/:id/pages", typeof Route40>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/inbox/:id", typeof Route41>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/howl/:id/comment", typeof Route42>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/howl/:id", typeof Route43>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/howl/:id/react", typeof Route44>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/folder/:id", typeof Route45>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/feed/:id", typeof Route46>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/dm/messages/:id", typeof Route47>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/dm/channels/:id", typeof Route48>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/dm/channels/:id/messages", typeof Route49>
              & ElysiaWithBaseUrl<"D:/dev/korat-hb/apps/server/src/routes/pack/:id/themes/:theme_id", typeof Route50>
