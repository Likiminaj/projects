h#include "philo.h"

int	main(int argc, char **argv)
{
	t_table	table;

	if (argc != 5 && argc !=6)
	{
		printf("Error\nUsage: Please clearly define the number of philosophers, time to eat, time to die and time to sleep. Optionally, you may also choose to define the number of times each philosopher must eat\n")
	}
	if (!parse_args(argc, argv, &table))
		return (printf("Error\nInvalid arguments\n"), 1);
	if (!init_table(&table)
		return (printf("Error\nInit failed\n"), 1);
	if (!start_simulation(&table))
	{
		cleanup(&table);
		return (printf("Error\nThread creation failed\n"), 1);
	}
	cleanup(&table);
	return (0);
}
