import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type Route0 from "./routes/health";
import type Route1 from "./routes/search/index";
import type Route2 from "./routes/pack/create";
import type Route3 from "./routes/store/index";
import type Route4 from "./routes/dipswitch/index";
import type Route5 from "./routes/server/describeServer";
import type Route6 from "./routes/server/insight";
import type Route7 from "./routes/server/fwupd/check";
import type Route8 from "./routes/user/me/storage";
import type Route9 from "./routes/user/me/index";
import type Route10 from "./routes/user/me/badge";
import type Route11 from "./routes/user/me/friends";
import type Route12 from "./routes/user/me/packs";
import type Route13 from "./routes/news/index";
import type Route14 from "./routes/invite/list";
import type Route15 from "./routes/invite/generate";
import type Route16 from "./routes/admin/sql";
import type Route17 from "./routes/themes/index";
import type Route18 from "./routes/themes/validate";
import type Route19 from "./routes/inbox/index";
import type Route20 from "./routes/inbox/fetch";
import type Route21 from "./routes/inbox/read";
import type Route22 from "./routes/dm/channels/index";
import type Route23 from "./routes/howl/create";
import type Route24 from "./routes/packs/index";
import type Route25 from "./routes/pack/[id]/theme";
import type Route26 from "./routes/pack/[id]/index";
import type Route27 from "./routes/pack/[id]/join";
import type Route28 from "./routes/pack/[id]/members";
import type Route29 from "./routes/pack/[id]/settings/index";
import type Route30 from "./routes/pack/[id]/themes/index";
import type Route31 from "./routes/pack/[id]/themes/validate";
import type Route32 from "./routes/pack/[id]/pages/index";
import type Route33 from "./routes/store/[item_id]/index";
import type Route34 from "./routes/user/[username]/theme";
import type Route35 from "./routes/user/[username]/index";
import type Route36 from "./routes/user/[username]/follow";
import type Route37 from "./routes/themes/[id]/index";
import type Route38 from "./routes/inbox/[id]/index";
import type Route39 from "./routes/dm/messages/[id]/index";
import type Route40 from "./routes/dm/channels/[id]/messages";
import type Route41 from "./routes/dm/channels/[id]/index";
import type Route42 from "./routes/howl/[id]/index";
import type Route43 from "./routes/howl/[id]/comment";
import type Route44 from "./routes/howl/[id]/react";
import type Route45 from "./routes/feed/[id]/index";
import type Route46 from "./routes/pack/[id]/themes/[theme_id]/index";


    export type Packbase = ElysiaWithBaseUrl<"/health", typeof Route0>
              & ElysiaWithBaseUrl<"/search", typeof Route1>
              & ElysiaWithBaseUrl<"/pack/create", typeof Route2>
              & ElysiaWithBaseUrl<"/store", typeof Route3>
              & ElysiaWithBaseUrl<"/dipswitch", typeof Route4>
              & ElysiaWithBaseUrl<"/server/describeServer", typeof Route5>
              & ElysiaWithBaseUrl<"/server/insight", typeof Route6>
              & ElysiaWithBaseUrl<"/server/fwupd/check", typeof Route7>
              & ElysiaWithBaseUrl<"/user/me/storage", typeof Route8>
              & ElysiaWithBaseUrl<"/user/me", typeof Route9>
              & ElysiaWithBaseUrl<"/user/me/badge", typeof Route10>
              & ElysiaWithBaseUrl<"/user/me/friends", typeof Route11>
              & ElysiaWithBaseUrl<"/user/me/packs", typeof Route12>
              & ElysiaWithBaseUrl<"/news", typeof Route13>
              & ElysiaWithBaseUrl<"/invite/list", typeof Route14>
              & ElysiaWithBaseUrl<"/invite/generate", typeof Route15>
              & ElysiaWithBaseUrl<"/admin/sql", typeof Route16>
              & ElysiaWithBaseUrl<"/themes", typeof Route17>
              & ElysiaWithBaseUrl<"/themes/validate", typeof Route18>
              & ElysiaWithBaseUrl<"/inbox", typeof Route19>
              & ElysiaWithBaseUrl<"/inbox/fetch", typeof Route20>
              & ElysiaWithBaseUrl<"/inbox/read", typeof Route21>
              & ElysiaWithBaseUrl<"/dm/channels", typeof Route22>
              & ElysiaWithBaseUrl<"/howl/create", typeof Route23>
              & ElysiaWithBaseUrl<"/packs", typeof Route24>
              & ElysiaWithBaseUrl<"/pack/:id/theme", typeof Route25>
              & ElysiaWithBaseUrl<"/pack/:id", typeof Route26>
              & ElysiaWithBaseUrl<"/pack/:id/join", typeof Route27>
              & ElysiaWithBaseUrl<"/pack/:id/members", typeof Route28>
              & ElysiaWithBaseUrl<"/pack/:id/settings", typeof Route29>
              & ElysiaWithBaseUrl<"/pack/:id/themes", typeof Route30>
              & ElysiaWithBaseUrl<"/pack/:id/themes/validate", typeof Route31>
              & ElysiaWithBaseUrl<"/pack/:id/pages", typeof Route32>
              & ElysiaWithBaseUrl<"/store/:item_id", typeof Route33>
              & ElysiaWithBaseUrl<"/user/:username/theme", typeof Route34>
              & ElysiaWithBaseUrl<"/user/:username", typeof Route35>
              & ElysiaWithBaseUrl<"/user/:username/follow", typeof Route36>
              & ElysiaWithBaseUrl<"/themes/:id", typeof Route37>
              & ElysiaWithBaseUrl<"/inbox/:id", typeof Route38>
              & ElysiaWithBaseUrl<"/dm/messages/:id", typeof Route39>
              & ElysiaWithBaseUrl<"/dm/channels/:id/messages", typeof Route40>
              & ElysiaWithBaseUrl<"/dm/channels/:id", typeof Route41>
              & ElysiaWithBaseUrl<"/howl/:id", typeof Route42>
              & ElysiaWithBaseUrl<"/howl/:id/comment", typeof Route43>
              & ElysiaWithBaseUrl<"/howl/:id/react", typeof Route44>
              & ElysiaWithBaseUrl<"/feed/:id", typeof Route45>
              & ElysiaWithBaseUrl<"/pack/:id/themes/:theme_id", typeof Route46>
