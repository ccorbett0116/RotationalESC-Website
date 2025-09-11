import Layout from "@/components/Layout";
import SectionsWithManufacturers from "@/components/SectionsWithManufacturers";
import { useCanonical } from "@/hooks/useCanonical";

const Packing = () => {
    useCanonical('/packing');
    return (
        <Layout>
            <SectionsWithManufacturers 
                title="Packing"
                description="Discover our comprehensive range of industrial packing solutions from leading manufacturers. We offer various types of packing materials for sealing applications."
                page="packing"
            />
        </Layout>
    );
};

export default Packing;
