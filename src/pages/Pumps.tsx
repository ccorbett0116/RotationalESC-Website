import Layout from "@/components/Layout";
import SectionsWithManufacturers from "@/components/SectionsWithManufacturers";
import { useCanonical } from "@/hooks/useCanonical";

const Pumps = () => {
    useCanonical('/pumps');
    return (
        <Layout>
            <SectionsWithManufacturers 
                title="Pumps"
                description="Explore our selection of industrial pumps from leading manufacturers. We offer a wide range of pump types including centrifugal, diaphragm, positive displacement, and more."
                page="pumps"
            />
        </Layout>
    );
};

export default Pumps;
