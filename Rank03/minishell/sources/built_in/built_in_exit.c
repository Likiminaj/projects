/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   built_in_exit.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/18 17:01:21 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/04 13:44:16 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		builtin_exit(t_ast *ast, t_env *env);
void	set_exit(t_env *env, int exit_status, int should_exit);
int		ft_isnum(char *string);

/* Terminates the shell with a specific exit status.*/
int	builtin_exit(t_ast *ast, t_env *env)
{
	int	exit_status;

	ft_printf("exit\n");
	if (ast->args[1] != NULL && ast->args[2] != NULL)
		return (ft_putendl_fd("minishell: exit: too many arguments", 2), 1);
	if (ast->args[1] == NULL)
		return (set_exit(env, 0, 1), 0);
	if (ft_isnum(ast->args[1]) == 0)
	{
		ft_putstr_fd("minishell: exit: ", 2);
		ft_putstr_fd(ast->args[1], 2);
		ft_putendl_fd(": numeric argument required", 2);
		return (set_exit(env, 2, 1), 2);
	}
	exit_status = ft_atoi(ast->args[1]);
	set_exit(env, ((exit_status % 256 + 256) % 256), 1);
	return (0);
}

void	set_exit(t_env *env, int exit_status, int should_exit)
{
	env->exit_status = exit_status;
	env->should_exit = should_exit;
}

int	ft_isnum(char *string)
{
	int	i;

	i = 0;
	if (!string || string[0] == '\0')
		return (0);
	if (string[i] == '-' || string[i] == '+')
		i++;
	if (string[i] == '\0')
		return (0);
	while (string[i] != '\0')
	{
		if (!(string[i] >= '0' && string[i] <= '9'))
			return (0);
		i++;
	}
	return (1);
}
