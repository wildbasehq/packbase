import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type Route0 from "./routes/user/me/badge";
import type Route1 from "./routes/user/me/index";
import type Route2 from "./routes/user/me/packs";
import type Route3 from "./routes/themes/index";
import type Route4 from "./routes/themes/validate";
import type Route5 from "./routes/server/describeServer";
import type Route6 from "./routes/server/insight";
import type Route7 from "./routes/search/index";
import type Route8 from "./routes/packs/index";
import type Route9 from "./routes/pack/create";
import type Route10 from "./routes/invite/generate";
import type Route11 from "./routes/invite/list";
import type Route12 from "./routes/inbox/fetch";
import type Route13 from "./routes/inbox/index";
import type Route14 from "./routes/inbox/read";
import type Route15 from "./routes/howl/create";
import type Route16 from "./routes/dipswitch/index";
import type Route17 from "./routes/user/[username]/follow";
import type Route18 from "./routes/user/[username]/index";
import type Route19 from "./routes/user/[username]/theme";
import type Route20 from "./routes/themes/[id]/index";
import type Route21 from "./routes/pack/[id]/index";
import type Route22 from "./routes/pack/[id]/join";
import type Route23 from "./routes/pack/[id]/members";
import type Route24 from "./routes/pack/[id]/pages/index";
import type Route25 from "./routes/inbox/[id]/index";
import type Route26 from "./routes/howl/[id]/comment";
import type Route27 from "./routes/howl/[id]/index";
import type Route28 from "./routes/howl/[id]/react";
import type Route29 from "./routes/feed/[id]/index";


    export type Packbase = ElysiaWithBaseUrl<"/user/me/badge", typeof Route0>
              & ElysiaWithBaseUrl<"/user/me", typeof Route1>
              & ElysiaWithBaseUrl<"/user/me/packs", typeof Route2>
              & ElysiaWithBaseUrl<"/themes", typeof Route3>
              & ElysiaWithBaseUrl<"/themes/validate", typeof Route4>
              & ElysiaWithBaseUrl<"/server/describeServer", typeof Route5>
              & ElysiaWithBaseUrl<"/server/insight", typeof Route6>
              & ElysiaWithBaseUrl<"/search", typeof Route7>
              & ElysiaWithBaseUrl<"/packs", typeof Route8>
              & ElysiaWithBaseUrl<"/pack/create", typeof Route9>
              & ElysiaWithBaseUrl<"/invite/generate", typeof Route10>
              & ElysiaWithBaseUrl<"/invite/list", typeof Route11>
              & ElysiaWithBaseUrl<"/inbox/fetch", typeof Route12>
              & ElysiaWithBaseUrl<"/inbox", typeof Route13>
              & ElysiaWithBaseUrl<"/inbox/read", typeof Route14>
              & ElysiaWithBaseUrl<"/howl/create", typeof Route15>
              & ElysiaWithBaseUrl<"/dipswitch", typeof Route16>
              & ElysiaWithBaseUrl<"/user/:username/follow", typeof Route17>
              & ElysiaWithBaseUrl<"/user/:username", typeof Route18>
              & ElysiaWithBaseUrl<"/user/:username/theme", typeof Route19>
              & ElysiaWithBaseUrl<"/themes/:id", typeof Route20>
              & ElysiaWithBaseUrl<"/pack/:id", typeof Route21>
              & ElysiaWithBaseUrl<"/pack/:id/join", typeof Route22>
              & ElysiaWithBaseUrl<"/pack/:id/members", typeof Route23>
              & ElysiaWithBaseUrl<"/pack/:id/pages", typeof Route24>
              & ElysiaWithBaseUrl<"/inbox/:id", typeof Route25>
              & ElysiaWithBaseUrl<"/howl/:id/comment", typeof Route26>
              & ElysiaWithBaseUrl<"/howl/:id", typeof Route27>
              & ElysiaWithBaseUrl<"/howl/:id/react", typeof Route28>
              & ElysiaWithBaseUrl<"/feed/:id", typeof Route29>
