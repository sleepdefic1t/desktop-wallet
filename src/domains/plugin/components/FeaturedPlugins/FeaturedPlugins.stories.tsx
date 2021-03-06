import { boolean } from "@storybook/addon-knobs";
import React from "react";

import { plugins } from "../../data";
import { FeaturedPlugins } from "./FeaturedPlugins";

export default { title: "Domains / Plugin / Components / FeaturedPlugins" };

export const Default = () => (
	<FeaturedPlugins isOpen={boolean("Is Open", true)} plugins={plugins} onClose={() => alert("closed")} />
);
