/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   built_in_unset.c                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/18 17:12:05 by chlpesty          #+#    #+#             */
/*   Updated: 2026/01/18 17:15:03 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		builtin_unset(t_ast *ast, t_env *env);
void	remove_var(char **envp, int index);

/* Suppresses variable(s) in envp */
int	builtin_unset(t_ast *ast, t_env *env)
{
	int	i;
	int	index;

	i = 1;
	while (ast->args[i] != NULL)
	{
		index = find_index_in_env(env->envp, ast->args[i]);
		if (index != -1)
			remove_var(env->envp, index);
		i++;
	}
	return (0);
}

/* Removes an environment variable from envp and shift the 
remaining variables left. */
void	remove_var(char **envp, int index)
{
	int	i;

	if (!envp || envp[index] == NULL)
		return ;
	i = index;
	free(envp[index]);
	while (envp[i + 1] != NULL)
	{
		envp[i] = envp[i + 1];
		i++;
	}
	envp[i] = NULL;
}
