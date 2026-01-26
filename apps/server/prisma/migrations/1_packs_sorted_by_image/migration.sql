CREATE MATERIALIZED VIEW packs_sorted AS
SELECT
    p.id,
    p.created_at,
    p.display_name,
    p.slug,
    p.images_avatar,
    p.description,
    p.owner_id,
    p.images_header,
    p.last_activity_at,
    CASE
        WHEN p.images_avatar IS NOT NULL AND p.images_header IS NOT NULL THEN 1
        WHEN p.images_avatar IS NOT NULL OR p.images_header IS NOT NULL THEN 2
        ELSE 3
        END AS image_priority,
    COALESCE(COUNT(m.id), 0) AS member_count
FROM
    packs p
LEFT JOIN "packs.memberships" m ON p.id = m.tenant_id
GROUP BY
    p.id,
    p.created_at,
    p.display_name,
    p.slug,
    p.images_avatar,
    p.description,
    p.owner_id,
    p.images_header,
    p.last_activity_at
ORDER BY
    image_priority ASC,
    p.last_activity_at DESC;

-- Create indexes on the materialized view for better query performance
CREATE UNIQUE INDEX packs_sorted_id_idx ON packs_sorted (id);
CREATE INDEX packs_sorted_priority_activity_idx ON packs_sorted (image_priority, last_activity_at DESC);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_packs_sorted()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY packs_sorted;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view on packs table changes
CREATE TRIGGER refresh_packs_sorted_trigger
    AFTER INSERT OR UPDATE OR DELETE ON packs
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_packs_sorted();

-- Create trigger to refresh materialized view on memberships table changes
CREATE TRIGGER refresh_packs_sorted_memberships_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "packs.memberships"
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_packs_sorted();
