import NavigationSidebar from "@/components/navigation/navigation-sidebar";

const DMLayout = async ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <div className="h-full">
            {children}
        </div>
    );
}

export default DMLayout;
