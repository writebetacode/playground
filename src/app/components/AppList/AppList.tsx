import { A } from "@solidjs/router";
import { type Component, For, Show } from "solid-js";
import { apps } from "../../../apps/registry";

/**
 * A plain list of whatever the registry holds, standing in at the site root
 * until task 06 replaces it with the designed selector. The registry is empty
 * until the first app lands, so the empty state is the state it ships in.
 */
export const AppList: Component = () => {
	return (
		<section>
			<Show
				when={apps.length > 0}
				fallback={
					<p>No experiments are registered yet. The first one lands next.</p>
				}
			>
				<ul>
					<For each={apps}>
						{(app) => (
							<li>
								<A href={`/${app.id}`}>{app.name}</A>
								<p>{app.description}</p>
							</li>
						)}
					</For>
				</ul>
			</Show>
		</section>
	);
};
