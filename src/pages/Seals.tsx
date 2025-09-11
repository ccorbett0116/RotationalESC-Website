import Layout from "@/components/Layout";
import SectionsWithManufacturers from "@/components/SectionsWithManufacturers";
import { useCanonical } from "@/hooks/useCanonical";

const Seals = () => {
    useCanonical('/mechanical-seals');
    return (
        <Layout>
            <SectionsWithManufacturers 
                title="Mechanical Seals"
                description="Find high-quality mechanical seals from trusted manufacturers. Our extensive selection includes seals for various applications and industries."
                page="seals"
            />
        </Layout>
    );
};

export default Seals;
